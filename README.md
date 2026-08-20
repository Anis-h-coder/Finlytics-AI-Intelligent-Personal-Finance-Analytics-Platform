# 💰 Finlytics AI — Intelligent Personal Finance Analytics Platform

Finlytics AI is an AI-powered personal finance intelligence platform that transforms raw bank statements into actionable financial insights. Built with modern full-stack technologies, machine learning, and Generative AI, it automatically categorizes transactions, detects spending anomalies, forecasts financial trends, and generates personalized financial recommendations through an interactive AI advisor.

Designed for individuals seeking intelligent budgeting, spending optimization, and financial risk analysis.

🚀 Features

📊 Smart Financial Dashboard
Monitor your complete financial health from one place.

Features include:

Total Spending
Average Spending
Highest Expense
Financial Health Score
Risk Score
Monthly Spending Trends
Category Allocation Charts
PDF Report Export

💳 Intelligent Transaction Management
Manage transactions effortlessly.

Supports:

Manual Transaction Entry
Secure CSV Bank Statement Upload
Automatic Category Detection
Merchant Recognition
Transaction History
Delete & Refresh Operations

🤖 Machine Learning Transaction Classification
Automatically categorizes transaction descriptions using NLP.

Examples:

STARBUCKS COFFEE
→ Food & Dining (94%)

UBER TRIP
→ Transport (98%)

NETFLIX
→ Entertainment

Powered by:

TF-IDF Vectorization
Similarity Matching
Rule-based Classification

🚨 AI Anomaly Detection
Uses Isolation Forest Machine Learning to detect unusual financial activities.

Detects:

High-value purchases
Suspicious merchant behavior
Spending spikes
Unusual transaction timing
Budget outliers

Includes:

Isolation Score
Risk Rating
AI-generated protection recommendations

📈 Financial Forecasting
Analyze future spending trends using historical transaction patterns.

Provides:

Spending projections
Expense forecasts
Budget trend visualization
Financial outlook

🧠 Gemini AI Financial Advisor
Receive personalized financial guidance powered by Google Gemini.

The advisor generates:

Executive Summary
Spending Analysis
Cash Flow Analysis
Financial Health Report
Personalized Recommendations
Savings Opportunities
Risk Assessment
Budget Optimization Strategy

📄 Professional PDF Reports
Export detailed financial reports containing:

Executive Summary
Charts
Spending Distribution
Risk Analysis
AI Recommendations
Transaction Summary

🔒 Secure Authentication
Authentication powered by secure login.

Features:

User Registration
Login
Password Visibility Toggle
Session Management

---

# 📸 Platform Preview & UI Showcase

### 1. AI-Powered Authentication & Landing Experience

Modern authentication interface introducing Finlytics AI with live ML transaction classification and AI financial insights.

<img width="1898" height="1004" alt="Screenshot 2026-08-03 140648" src="https://github.com/user-attachments/assets/77625ff0-bb9d-41cb-8a69-5fbc63d1afb7" />

---

### 2. Manual Transaction Entry

Add individual transactions with automatic AI-powered category classification.

<img width="851" height="646" alt="Screenshot 2026-08-03 140743" src="https://github.com/user-attachments/assets/2bfdae7c-66d5-4076-ae63-8fbc68b45092" />

---

### 3. Secure CSV Statement Import

Upload bank statements using drag-and-drop CSV import.

<img width="811" height="542" alt="Screenshot 2026-08-03 140800" src="https://github.com/user-attachments/assets/bbbbf807-7d8f-4530-bcfb-3804c9f13738" />

---

### 5. Financial Analytics Dashboard

Interactive dashboard showing financial metrics, spending trends, category allocation, and AI-generated insights.

<img width="1895" height="1010" alt="Screenshot 2026-08-20 161723" src="https://github.com/user-attachments/assets/4a61e97e-abf5-4677-8d5b-9cc832473db1" />

---

### 6. Transaction Ledger

Comprehensive ledger with categorized transactions, suspicious activity detection, and statement history.
<img width="1896" height="1005" alt="Screenshot 2026-08-03 150927" src="https://github.com/user-attachments/assets/05372b25-850e-4044-9900-0a51d879d1da" />

---

### 7. Machine Learning Anomaly Detection

Isolation Forest engine identifies suspicious financial activities and provides protective recommendations.

<img width="1894" height="980" alt="Screenshot 2026-08-03 150955" src="https://github.com/user-attachments/assets/4ac2cd0f-5d53-4ee2-b45a-66710dfbc965" />

---

### 8. AI Executive Financial Report

Automatically generated executive summary with financial health scores and key performance indicators.

<img width="1919" height="1008" alt="Screenshot 2026-08-03 151101" src="https://github.com/user-attachments/assets/c1648d2e-0212-4adb-8e2e-f59946128135" />

---

### 9. Spending & Risk Analysis

Detailed AI analysis of spending behavior, category distribution, and detected financial risks.

<img width="1889" height="1006" alt="Screenshot 2026-08-03 151115" src="https://github.com/user-attachments/assets/fed830f5-ea12-480f-85fa-771f46d92ac1" />


---

### 10. Personalized Financial Recommendations

Google Gemini generates personalized budgeting strategies, savings opportunities, and actionable financial advice.

<img width="1894" height="1002" alt="Screenshot 2026-08-03 151130" src="https://github.com/user-attachments/assets/0fa60c7c-1b7b-41bd-a483-09e80d6ffc10" />


---

# 🏗️ Project Architecture

```
FinlyticsAI/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   └── assets/
│
├── server/
│   ├── api/
│   ├── ml/
│   ├── database/
│   └── middleware/
│
├── public/
├── docs/
│   └── screenshots/
│
├── finlytics.db
├── server.ts
├── package.json
└── README.md
```

---

# 🛠 Technology Stack

## Frontend

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

## Backend

- Node.js
- Express.js
- SQLite

## Artificial Intelligence

- Google Gemini API
- Prompt Engineering

## Machine Learning

- TF-IDF Vectorizer
- Isolation Forest
- Statistical Analysis

## Reports

- jsPDF
- jsPDF AutoTable

---

# ⚙️ Installation

```bash
git clone https://github.com/yourusername/FinlyticsAI.git

cd FinlyticsAI

npm install
```

Create a `.env` file.

```env
GEMINI_API_KEY=your_api_key
```

Run:

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

# 📊 AI Workflow

```
Bank Statement
        │
        ▼
CSV Parser
        │
        ▼
Transaction Classification
        │
        ▼
ML Feature Extraction
        │
        ▼
Isolation Forest Detection
        │
        ▼
Financial Analytics
        │
        ▼
Gemini AI Advisor
        │
        ▼
Dashboard + PDF Reports
```

---

# ✨ Future Enhancements

- Open Banking API Integration
- Real-time Expense Notifications
- Investment Portfolio Tracking
- Voice Financial Assistant
- OCR Receipt Scanner
- Multi-Currency Support
- Family Budget Management
- AI Budget Planner
- Subscription Detection
- Mobile Application

---

# 👨‍💻 Author

**Anish Fathima**

AI & Data Science Student

GitHub: https://github.com/Anis-h-coder

---

# 📄 License

Licensed under the MIT License.

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.
