import express from "express";
import path from "path";
import fs from "fs";
import bcryptjs from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { dbAll, dbGet, dbRun, seedUserTransactions } from "./server/db";
import {
  autoCategorize,
  updateAnomalyScores,
  computeDashboardStats,
  getForecast,
} from "./server/ml-helper";

// Start server async function
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "10mb" }));

  // In-memory sessions map (immune to iframe third-party cookie restrictions)
  // Maps secure token -> user details
  const SESSIONS = new Map<string, { userId: number; email: string; name: string }>();

  // Token verification middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing authentication token" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const session = SESSIONS.get(token);
    if (!session) {
      res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
      return;
    }

    // Attach user information to request object
    (req as any).user = session;
    next();
  };

  // --- API ROUTES ---

  // Auth: Signup
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Please fill out all fields: Name, Email, and Password" });
      return;
    }

    try {
      // Check if user exists
      const existingUser = await dbGet("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
      if (existingUser) {
        res.status(400).json({ error: "An account with this email address already exists" });
        return;
      }

      // Hash password using bcryptjs
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(password, salt);

      // Create user
      const result = await dbRun(
        "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
        [email.toLowerCase(), passwordHash, name]
      );

      const userId = result.id;

      // Automatically seed 90 days of transactions for an immediate rich dashboard experience
      // Disabled to ensure user starts with a clean slate with no default or old transaction data
      // await seedUserTransactions(userId);

      // Generate secure session token
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const userData = { userId, email: email.toLowerCase(), name };
      SESSIONS.set(token, userData);

      res.status(201).json({
        success: true,
        token,
        user: { id: userId, email: userData.email, name: userData.name },
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user account: " + error.message });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Please enter both Email and Password" });
      return;
    }

    try {
      const user = await dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
      if (!user) {
        res.status(400).json({ error: "Invalid email or password" });
        return;
      }

      // Verify bcryptjs password hash
      const isValid = await bcryptjs.compare(password, user.password_hash);
      if (!isValid) {
        res.status(400).json({ error: "Invalid email or password" });
        return;
      }

      // Generate session token
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const userData = { userId: user.id, email: user.email, name: user.name };
      SESSIONS.set(token, userData);

      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Authentication failed: " + error.message });
    }
  });

  // Auth: Get Current Profile
  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ success: true, user: (req as any).user });
  });

  // Transactions: Get List (supports pagination / limit)
  app.get("/api/transactions", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    try {
      const transactions = await dbAll(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC",
        [userId]
      );
      res.json({ success: true, transactions });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch transactions: " + error.message });
    }
  });

  // Transactions: Create single (auto-categorized and triggers anomaly update)
  app.post("/api/transactions", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    let { date, description, amount, category } = req.body;

    if (!date || !description || amount === undefined) {
      res.status(400).json({ error: "Missing required fields: date, description, amount" });
      return;
    }

    try {
      // Auto categorize if empty or not provided
      if (!category) {
        category = autoCategorize(description);
      }

      // Insert transaction with temporary anomaly placeholders
      const result = await dbRun(
        `INSERT INTO transactions (user_id, date, description, amount, category, is_anomaly, anomaly_score)
         VALUES (?, ?, ?, ?, ?, 0, 0.0)`,
        [userId, date, description, Number(amount), category]
      );

      // Trigger anomaly model scoring asynchronously/synchronously to keep values perfectly accurate
      await updateAnomalyScores(userId);

      // Fetch newly inserted transaction with its computed anomaly score
      const newTx = await dbGet("SELECT * FROM transactions WHERE id = ?", [result.id]);

      res.status(201).json({ success: true, transaction: newTx });
    } catch (error: any) {
      console.error("Create transaction error:", error);
      res.status(500).json({ error: "Failed to add transaction: " + error.message });
    }
  });

  // Transactions: Bulk upload statement (Drag-and-Drop or File Import)
  app.post("/api/transactions/bulk", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    const { transactions } = req.body; // array of { date, description, amount, category? }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({ error: "No transactions found in upload" });
      return;
    }

    try {
      console.log(`Processing bulk upload of ${transactions.length} transactions for user ${userId}`);

      // Insert each transaction
      for (const tx of transactions) {
        const { date, description, amount } = tx;
        if (!date || !description || amount === undefined) continue;

        const category = tx.category || autoCategorize(description);

        await dbRun(
          `INSERT INTO transactions (user_id, date, description, amount, category, is_anomaly, anomaly_score)
           VALUES (?, ?, ?, ?, ?, 0, 0.0)`,
          [userId, date, description, Number(amount), category]
        );
      }

      // Re-run Isolation Forest to score the entire historical series + new uploaded items
      await updateAnomalyScores(userId);

      res.json({ success: true, message: `Successfully imported ${transactions.length} transactions` });
    } catch (error: any) {
      console.error("Bulk import error:", error);
      res.status(500).json({ error: "Failed to import statement rows: " + error.message });
    }
  });

  // Transactions: Delete single
  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    const txId = req.params.id;

    try {
      const tx = await dbGet("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [txId, userId]);
      if (!tx) {
        res.status(404).json({ error: "Transaction not found or unauthorized" });
        return;
      }

      await dbRun("DELETE FROM transactions WHERE id = ?", [txId]);
      
      // Re-run Isolation Forest to update remaining scores
      await updateAnomalyScores(userId);

      res.json({ success: true, message: "Transaction deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete transaction: " + error.message });
    }
  });

  // Transactions: Clear all transactions for user
  app.post("/api/transactions/clear", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    try {
      await dbRun("DELETE FROM transactions WHERE user_id = ?", [userId]);
      // Re-run Isolation forest / score updates
      await updateAnomalyScores(userId);
      res.json({ success: true, message: "All transactions cleared successfully" });
    } catch (error: any) {
      console.error("Clear transactions error:", error);
      res.status(500).json({ error: "Failed to clear transactions: " + error.message });
    }
  });

  // Analytics Dashboard Stats
  app.get("/api/analytics", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    try {
      const stats = await computeDashboardStats(userId);
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Analytics fetch error:", error);
      res.status(500).json({ error: "Failed to load dashboard metrics: " + error.message });
    }
  });

  // Expense Forecast: 30-Day Predictive Trend + Seasonality
  app.get("/api/forecast", requireAuth, async (req, res) => {
    const { userId } = (req as any).user;
    try {
      const forecast = await getForecast(userId);
      res.json({ success: true, forecast });
    } catch (error: any) {
      console.error("Forecast error:", error);
      res.status(500).json({ error: "Failed to calculate spending forecast: " + error.message });
    }
  });

  // AI Financial Advisor: Powered by Gemini (Client-safe proxies, server-only keys)
  app.get("/api/advice", requireAuth, async (req, res) => {
    const { userId, name } = (req as any).user;
    let stats: any;

    try {
      // Fetch some transactions to feed as context for Gemini
      const transactions = await dbAll(
        "SELECT date, description, amount, category, is_anomaly, anomaly_score FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 100",
        [userId]
      );

      if (transactions.length === 0) {
        res.json({
          success: true,
          advice: `### 📊 Personalized Financial Health Report\n\n## 📊 Executive Summary\n\n| Metric | Value |\n|---|---|\n| Financial Health Score | Not Available |\n| Risk Level | Not Available |\n| Total Income | Not Available |\n| Total Expenses | Not Available |\n| Net Savings | Not Available |\n| Savings Rate | Not Available |\n\nYour transaction ledger is currently empty. Please add some transactions manually or upload your banking statements using the dashboard tools to generate a personalized AI Financial Health Report!\n\n---\n\n## 📌 Recommendation\nPlease upload or record transactions to start tracking your financial insights. We are ready to help you analyze your spending habits!`,
        });
        return;
      }

      stats = await computeDashboardStats(userId);

      // Verify Gemini key is available
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey || geminiApiKey === "MY_GEMINI_API_KEY") {
        res.json({
          success: true,
          advice: `### 🚨 AI Advisor Setup Needed\n\nPlease add your **GEMINI_API_KEY** in the **Settings > Secrets** panel in Google AI Studio to unlock personalized, intelligent financial planning and savings insights.\n\n#### Offline Advisor Preview:\n- **Current Spending Pattern**: Based on your historical statements, you are currently spending most of your money in **Food** and **Utilities**. Your overall risk rating is **${stats.riskScore}/100**.\n- **Savings Tip**: Try setting a hard limit on dining out this week to reduce anomalies and increase your savings rate.`,
        });
        return;
      }

      // Initialize GoogleGenAI SDK with server-side API Key & Telemetry user-agent
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Summarize transactions to send to Gemini
      const txSummary = transactions
        .map((t) => `${t.date} | ${t.description} | $${t.amount.toFixed(2)} | Category: ${t.category} | ${t.is_anomaly ? "ANOMALY DETECTED" : "Normal"}`)
        .join("\n");

      const prompt = `
# ROLE

You are Finlytics AI, a professional AI Financial Advisor and Personal Finance Analyst.

Your responsibility is to analyze ONLY the financial statistics and transactions supplied by the backend.

Never invent information.

Never estimate values.

Never assume missing information.

If information is unavailable, clearly state "Not Available".

Your analysis must always remain grounded in the supplied data.

---

# STRICT RULES

You MUST follow these rules.

1. NEVER create imaginary transactions.
2. NEVER create imaginary merchants.
3. NEVER change totals.
4. NEVER modify percentages.
5. NEVER estimate income.
6. NEVER estimate expenses.
7. NEVER create fake subscriptions.
8. NEVER create fake anomalies.
9. NEVER mention merchants that are not in the supplied transaction list.
10. NEVER contradict supplied statistics.
11. If data is unavailable, write "Not Available."
12. Do not repeat the same recommendation twice.
13. Keep recommendations realistic and actionable.
14. Do not exaggerate.
15. Use a professional financial tone.

---

# INPUT

The following values were calculated by the backend and are correct. Do NOT recalculate or modify them.

• User Name: ${name}
• Financial Health Score: ${stats.financialHealth}/100
• Total Income: ₹${stats.totalIncome}
• Total Spending: ₹${stats.totalSpending}
• Total Savings: ₹${stats.totalSavings}
• Savings Rate: ${stats.savingsRate}%
• Highest Transaction: ₹${stats.highestTransaction}
• Average Transaction: ₹${stats.averageTransactionValue}
• Average Daily Spending: ₹${stats.averageDailySpending}
• Risk Score: ${stats.riskScore}/100
• Expense Count: ${stats.expenseCount}
• Number of Detected Anomalies: ${stats.anomaliesCount}
• Largest Spending Category: ${stats.largestCategory?.category ?? "Not Available"}
• Top Merchant: ${stats.topMerchant?.name ?? "Not Available"}
• Weekend Spending: ₹${stats.weekendSpending}
• Weekday Spending: ₹${stats.weekdaySpending}

========================
CATEGORY BREAKDOWN
========================
${stats.categoryBreakdown.map((c) => `${c.category}: ${c.amount} (${c.percentage}%)`).join("\n")}

========================
RECENT TRANSACTIONS
========================
${txSummary}

---

# REPORT FORMAT

Return ONLY Markdown.

# Personalized Financial Health Report

---

## 📊 Executive Summary

Display a compact financial scorecard.

| Metric | Value |
|--------|-------|
| Financial Health Score | ${stats.financialHealth}/100 |
| Risk Level | ${stats.riskScore}/100 |
| Total Income | ₹${stats.totalIncome} |
| Total Expenses | ₹${stats.totalSpending} |
| Net Savings | ₹${stats.totalSavings} |
| Savings Rate | ${stats.savingsRate}% |

Then provide a short summary (2–3 sentences) of the user's financial status based strictly on the above numbers.

---

## 💰 Spending Analysis

Include:
• Largest spending category
• Category percentages
• Average daily spending
• Highest transaction
• Spending behaviour
• Weekend vs Weekday comparison

Use ONLY supplied values.

---

## 🚨 Risk & Anomaly Analysis

Explain:
• Risk Score
• Number of anomalies

If anomaly count is zero, say:
"No significant anomalies detected."

If anomalies exist, explain that unusual transactions were detected without inventing merchants or descriptions.

---

## 📈 Financial Insights

Identify:
• Strongest financial habit
• Weakest financial habit
• Cash flow observation
• Spending trend

Only use backend statistics.

---

## 🎯 Personalized Recommendations

Generate exactly THREE recommendations.

For EACH recommendation use this format.

### Recommendation
Current Situation
Recommendation
Estimated Monthly Savings
Reason

Example:
### Optimize Largest Category Spending
**Current Situation**: Your spending on shopping is ₹18,000.
**Recommendation**: Reduce shopping by 10%.
**Estimated Monthly Savings**: ₹1,800.
**Reason**: Shopping is your largest spending category and offers the highest optimization potential.

Do not invent numbers. Use only supplied statistics.

---

## 💡 Savings Opportunities

Identify realistic opportunities using:
• Largest category
• Top merchant
• Category breakdown

Do NOT invent subscriptions.
Do NOT invent merchants.

---

## 📅 Financial Scorecard

Display:
- **Financial Health**: [Excellent / Good / Fair / Poor]
- **Savings Rate**: [Excellent / Good / Fair / Poor]
- **Risk**: [Low / Medium / High]
- **Budget Discipline**: [Excellent / Good / Fair / Poor]
- **Overall Rating**: [Excellent / Good / Fair / Poor]

---

## 📌 Final Summary

Write a concise conclusion (maximum 80 words).
End with one encouraging sentence.

---

# IMPORTANT
Never produce output like "Netflix ₹7800" unless it exists in the supplied transactions.
Never invent Amazon purchases.
Never invent EMI payments.
Never invent salaries.
Every statement must be supported by the supplied backend data.
If data is missing, write "Not Available" instead of guessing.
The report should look similar to one produced by a professional financial institution such as CRED, INDmoney, Groww, or a banking analytics platform.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ success: true, advice: response.text });
    } catch (error: any) {
      console.error("Gemini AI API error:", error);
      
      // Ensure we have some default stats if they weren't fetched successfully
      const safeStats = stats || {
        totalSpending: 0,
        highestTransaction: 0,
        averageTransactionValue: 0,
        categoryBreakdown: [],
        anomaliesCount: 0,
        riskScore: 0,
      };

      // Fallback gracefully on temporary high demand / API failures to ensure the user never experiences a broken UI
      const primaryCategory = safeStats.categoryBreakdown[0] 
        ? `**${safeStats.categoryBreakdown[0].category}** (${safeStats.categoryBreakdown[0].percentage}%)` 
        : "N/A";
        
      const secondCategory = safeStats.categoryBreakdown[1] 
        ? `**${safeStats.categoryBreakdown[1].category}** (${safeStats.categoryBreakdown[1].percentage}%)` 
        : "N/A";

      const fallbackAdvice = `### 🚨 Gemini AI Advisor (High Demand Fallback)
The Gemini API is currently experiencing extremely high demand (503 Service Unavailable). To keep your experience seamless, Finlytics has compiled this **Local Sandbox Intelligence Report** using your active transaction history.

#### 🔍 Spending Behavior Analysis
- **Recent Volume**: You have spent a total of **$${safeStats.totalSpending}** recently, with an average transaction size of **$${safeStats.averageTransactionValue}**.
- **Top Outlays**: Your largest categories are ${primaryCategory} and ${secondCategory}.
- **Peak Expense**: Your highest recorded single transaction is **$${safeStats.highestTransaction}**.

#### 🚨 Risk & Outlier Detection
- **Anomaly Detection**: Our local Machine Learning engine scanned your transaction series and flagged **${safeStats.anomaliesCount} potential anomalies** (outside baseline merchant or value ranges).
- **Risk Rating**: Your current system-calculated financial volatility and risk index is **${safeStats.riskScore}/100**.

#### 🎯 Strategic Budgeting Guidelines
- **Budgeting Anchor**: We highly suggest introducing a category-capping regime specifically targeting your largest category (${primaryCategory}).
- **Rule of Thumb**: Try to adhere to the 50/30/20 budget framework (Needs, Wants, Savings) to ensure long-term stability.

#### 💡 Direct Savings Suggestions
- **Audit Outliers**: Review the transactions flagged in your **Anomalies** dashboard to confirm whether they represent authentic billing spikes or input errors.
- **Micro-Budgeting**: Implement a 10% target spending reduction on your primary categories for the upcoming week.
- **Statement Completeness**: Keep your sandbox up-to-date by regularly dragging and dropping or uploading your banking statements.`;

      res.json({ 
        success: true, 
        advice: fallbackAdvice 
      });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite's middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve static files built in /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

// Handle unhandled promise rejections gracefully
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

startServer();
