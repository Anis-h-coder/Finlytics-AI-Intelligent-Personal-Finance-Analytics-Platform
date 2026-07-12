import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

// Enable verbose mode to get better stack traces in case of database errors
const sqlite = sqlite3.verbose();

const DB_PATH = path.resolve(process.cwd(), "finlytics.db");

// Verify parent directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new sqlite.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database at:", DB_PATH);
    initializeSchema();
  }
});

// Helper functions that wrap sqlite3's callback-based API in Promises
export const dbRun = (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T);
      }
    });
  });
};

export const dbAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

function initializeSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      is_anomaly INTEGER DEFAULT 0,
      anomaly_score REAL DEFAULT 0.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `;

  db.exec(schema, (err) => {
    if (err) {
      console.error("Failed to initialize database schema:", err.message);
    } else {
      console.log("Database tables initialized successfully");
      seedDataIfEmpty();
    }
  });
}

// Seeds some realistic transaction data if the database is brand new so the user gets a rich experience on signup
async function seedDataIfEmpty() {
  try {
    const userCount = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM users");
    if (userCount && userCount.count === 0) {
      console.log("Database is empty. Seed data will be populated upon first user registration.");
    }
  } catch (error) {
    console.error("Error checking database empty status:", error);
  }
}

/**
 * Utility to seed high-quality mock transactions for a new user
 * to immediately showcase analytics, forecasting, anomaly detection, and AI financial advisor.
 */
export async function seedUserTransactions(userId: number) {
  const categories = ["Food", "Transport", "Shopping", "Income", "Utilities"];
  
  // Build 90 days of historic transactions up to today
  const seedTransactions: { date: string; description: string; amount: number; category: string }[] = [
    // Income (Monthly & Bi-weekly)
    { date: "-90", description: "Inbound Payroll Deposit Tech Corp", amount: 4500, category: "Income" },
    { date: "-60", description: "Inbound Payroll Deposit Tech Corp", amount: 4500, category: "Income" },
    { date: "-30", description: "Inbound Payroll Deposit Tech Corp", amount: 4500, category: "Income" },
    { date: "-1", description: "Inbound Payroll Deposit Tech Corp", amount: 4500, category: "Income" },
    
    { date: "-75", description: "Freelance Design Retainer", amount: 750, category: "Income" },
    { date: "-45", description: "Freelance Design Retainer", amount: 750, category: "Income" },
    { date: "-15", description: "Freelance Design Retainer", amount: 750, category: "Income" },

    // Utilities (Monthly)
    { date: "-85", description: "Electric Utility Power Energy", amount: -145, category: "Utilities" },
    { date: "-55", description: "Electric Utility Power Energy", amount: -152, category: "Utilities" },
    { date: "-25", description: "Electric Utility Power Energy", amount: -138, category: "Utilities" },

    { date: "-80", description: "Comcast Xfinity Wifi Internet", amount: -79.99, category: "Utilities" },
    { date: "-50", description: "Comcast Xfinity Wifi Internet", amount: -79.99, category: "Utilities" },
    { date: "-20", description: "Comcast Xfinity Wifi Internet", amount: -79.99, category: "Utilities" },

    { date: "-78", description: "AT&T Mobile Bill Phone Subscription", amount: -65, category: "Utilities" },
    { date: "-48", description: "AT&T Mobile Bill Phone Subscription", amount: -65, category: "Utilities" },
    { date: "-18", description: "AT&T Mobile Bill Phone Subscription", amount: -65, category: "Utilities" },

    { date: "-82", description: "Netflix Premium Streaming", amount: -22.99, category: "Utilities" },
    { date: "-52", description: "Netflix Premium Streaming", amount: -22.99, category: "Utilities" },
    { date: "-22", description: "Netflix Premium Streaming", amount: -22.99, category: "Utilities" },

    { date: "-81", description: "Spotify Music Subscription", amount: -14.99, category: "Utilities" },
    { date: "-51", description: "Spotify Music Subscription", amount: -14.99, category: "Utilities" },
    { date: "-21", description: "Spotify Music Subscription", amount: -14.99, category: "Utilities" },

    // Rent / Housing (Implicitly Shopping / Utilities, let's make it Utilities)
    { date: "-90", description: "Monthly Apartment Lease Rent Payment", amount: -1800, category: "Utilities" },
    { date: "-60", description: "Monthly Apartment Lease Rent Payment", amount: -1800, category: "Utilities" },
    { date: "-30", description: "Monthly Apartment Lease Rent Payment", amount: -1800, category: "Utilities" },

    // Regular Food (Weekly/Daily)
    { date: "-88", description: "Whole Foods Market Grocery", amount: -124.50, category: "Food" },
    { date: "-81", description: "Whole Foods Market Grocery", amount: -135.20, category: "Food" },
    { date: "-74", description: "Whole Foods Market Grocery", amount: -110.80, category: "Food" },
    { date: "-67", description: "Whole Foods Market Grocery", amount: -141.60, category: "Food" },
    { date: "-60", description: "Whole Foods Market Grocery", amount: -118.90, category: "Food" },
    { date: "-53", description: "Whole Foods Market Grocery", amount: -150.30, category: "Food" },
    { date: "-46", description: "Whole Foods Market Grocery", amount: -122.40, category: "Food" },
    { date: "-39", description: "Whole Foods Market Grocery", amount: -134.10, category: "Food" },
    { date: "-32", description: "Whole Foods Market Grocery", amount: -129.50, category: "Food" },
    { date: "-25", description: "Whole Foods Market Grocery", amount: -142.80, category: "Food" },
    { date: "-18", description: "Whole Foods Market Grocery", amount: -115.60, category: "Food" },
    { date: "-11", description: "Whole Foods Market Grocery", amount: -138.90, category: "Food" },
    { date: "-4", description: "Whole Foods Market Grocery", amount: -145.20, category: "Food" },

    // Coffee & Cafes (Frequent small transactions)
    { date: "-87", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-84", description: "Starbucks Coffee", amount: -7.20, category: "Food" },
    { date: "-82", description: "Starbucks Coffee", amount: -5.80, category: "Food" },
    { date: "-79", description: "Starbucks Coffee", amount: -8.10, category: "Food" },
    { date: "-76", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-73", description: "Starbucks Coffee", amount: -7.50, category: "Food" },
    { date: "-69", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-65", description: "Starbucks Coffee", amount: -5.80, category: "Food" },
    { date: "-61", description: "Starbucks Coffee", amount: -8.50, category: "Food" },
    { date: "-58", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-54", description: "Starbucks Coffee", amount: -7.20, category: "Food" },
    { date: "-50", description: "Starbucks Coffee", amount: -5.80, category: "Food" },
    { date: "-45", description: "Starbucks Coffee", amount: -8.10, category: "Food" },
    { date: "-40", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-36", description: "Starbucks Coffee", amount: -7.50, category: "Food" },
    { date: "-31", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-27", description: "Starbucks Coffee", amount: -5.80, category: "Food" },
    { date: "-23", description: "Starbucks Coffee", amount: -8.50, category: "Food" },
    { date: "-19", description: "Starbucks Coffee", amount: -6.45, category: "Food" },
    { date: "-15", description: "Starbucks Coffee", amount: -7.20, category: "Food" },
    { date: "-10", description: "Starbucks Coffee", amount: -5.80, category: "Food" },
    { date: "-7", description: "Starbucks Coffee", amount: -8.10, category: "Food" },
    { date: "-3", description: "Starbucks Coffee", amount: -6.45, category: "Food" },

    // Restaurants / Dining out
    { date: "-86", description: "Sushi Bistro Dinner", amount: -84.20, category: "Food" },
    { date: "-72", description: "Burger Joint Grill Lunch", amount: -28.50, category: "Food" },
    { date: "-58", description: "The Italian Trattoria Wine & Dinner", amount: -112.40, category: "Food" },
    { date: "-44", description: "Pizza Delivery Family Size", amount: -36.50, category: "Food" },
    { date: "-30", description: "Ramen House Noodles", amount: -24.80, category: "Food" },
    { date: "-16", description: "Steakhouse Celebration Dinner", amount: -185.00, category: "Food" },
    { date: "-2", description: "Mexican Grill Tacos & Drinks", amount: -42.60, category: "Food" },

    // Transport (Gas & Ride sharing)
    { date: "-85", description: "Shell Oil Gas Station Refuel", amount: -45.20, category: "Transport" },
    { date: "-75", description: "Shell Oil Gas Station Refuel", amount: -42.80, category: "Transport" },
    { date: "-65", description: "Chevron Gas Station Refuel", amount: -48.50, category: "Transport" },
    { date: "-55", description: "Chevron Gas Station Refuel", amount: -46.10, category: "Transport" },
    { date: "-45", description: "Shell Oil Gas Station Refuel", amount: -43.90, category: "Transport" },
    { date: "-35", description: "Shell Oil Gas Station Refuel", amount: -44.80, category: "Transport" },
    { date: "-25", description: "Chevron Gas Station Refuel", amount: -49.20, category: "Transport" },
    { date: "-15", description: "Chevron Gas Station Refuel", amount: -45.50, category: "Transport" },
    { date: "-5", description: "Shell Oil Gas Station Refuel", amount: -47.10, category: "Transport" },

    { date: "-80", description: "Uber Ride Airport Trip", amount: -38.50, category: "Transport" },
    { date: "-68", description: "Uber Ride Late Night Taxi", amount: -21.40, category: "Transport" },
    { date: "-50", description: "Lyft Ride Ride-share to Event", amount: -18.90, category: "Transport" },
    { date: "-42", description: "Uber Ride Business Meeting", amount: -26.50, category: "Transport" },
    { date: "-22", description: "Lyft Ride Ride-share to Event", amount: -19.80, category: "Transport" },
    { date: "-8", description: "Uber Ride Late Night Taxi", amount: -24.10, category: "Transport" },

    // Shopping (Retail / Subscriptions / Services)
    { date: "-89", description: "Amazon Prime Monthly Membership", amount: -14.99, category: "Shopping" },
    { date: "-59", description: "Amazon Prime Monthly Membership", amount: -14.99, category: "Shopping" },
    { date: "-29", description: "Amazon Prime Monthly Membership", amount: -14.99, category: "Shopping" },

    { date: "-83", description: "Target Retail Essentials Store", amount: -84.20, category: "Shopping" },
    { date: "-61", description: "Target Retail Essentials Store", amount: -112.50, category: "Shopping" },
    { date: "-33", description: "Walmart Supercenter Household", amount: -94.10, category: "Shopping" },
    { date: "-12", description: "Target Retail Essentials Store", amount: -64.80, category: "Shopping" },

    { date: "-71", description: "Nike Online Shoes Apparel", amount: -120.00, category: "Shopping" },
    { date: "-41", description: "Best Buy Electronics Laptop Charger", amount: -49.99, category: "Shopping" },
    { date: "-14", description: "Apple Services Subscription App", amount: -9.99, category: "Shopping" },

    // Anomaly Transactions! Let's build explicit Anomalies so that Isolation Forest can flag them
    // Anomaly 1: Extremely high electronic shopping transaction relative to average shopping
    { date: "-45", description: "CRITICAL ALERT: Apple Store Macbook Pro Premium Purchase", amount: -2499.00, category: "Shopping" },
    // Anomaly 2: Very high restaurant dinner bill (excessive)
    { date: "-20", description: "The Ritz Carlton Hotel Fine Dining Event", amount: -850.00, category: "Food" },
  ];

  // Insert seed transactions
  const today = new Date();
  
  // Prepare insert statements
  for (const t of seedTransactions) {
    const daysOffset = parseInt(t.date, 10);
    const date = new Date(today);
    date.setDate(today.getDate() + daysOffset);
    const dateStr = date.toISOString().split("T")[0];

    // Compute standard Isolation Forest score dynamically or statically
    // For MacBook Pro (2499) and Ritz Carlton (850), let's flag them directly as anomalous in DB seed
    const isAnomaly = Math.abs(t.amount) > 800 ? 1 : 0;
    const anomalyScore = Math.abs(t.amount) > 800 ? 0.85 : 0.42;

    await dbRun(
      `INSERT INTO transactions (user_id, date, description, amount, category, is_anomaly, anomaly_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, dateStr, t.description, t.amount, t.category, isAnomaly, anomalyScore]
    );
  }

  console.log(`Successfully seeded ${seedTransactions.length} transactions for user ID ${userId}`);
}
