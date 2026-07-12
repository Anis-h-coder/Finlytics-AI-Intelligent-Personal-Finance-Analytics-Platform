# Finlytics AI — Intelligent Wealth & Risk Suite

Finlytics AI is a comprehensive, full-stack personal finance manager and machine learning-powered audit tool. It allows users to track their transaction ledgers, analyze spending allocations, forecast future balances, consult an interactive AI Financial Advisor, and flag transaction anomalies using modern isolation forest models.

---

## 🌟 Key Features

- **Interactive Financial Dashboard**: Dynamic metrics showing total income, outflows, savings rates, and financial health scores paired with intuitive category breakdowns.
- **Machine Learning Auditing**: Leverages server-side mathematical models (TF-IDF Vectorizers and Isolation Forest baselines) to auto-flag anomalous transactions (outliers).
- **Beautiful PDF Statement Exports**: Generates and downloads a clean, highly professional multi-page financial health and audit dossier using custom-styled layout templates.
- **Vast Data Import System**: Support for manual single-entry logs as well as smart CSV imports with custom column mappings and full-wipe settings.
- **AI-Powered Advice**: Interactive consultation with an on-demand AI Financial Advisor driven by modern generative models.
- **Secure Authentication**: Dedicated sign-in and sign-up portals featuring password visibility toggles.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Node.js, Express, SQLite (local relational ledger DB)
- **Machine Learning**: Node-based tf-idf and Isolation Forest implementations
- **PDF Generation**: `jspdf`, `jspdf-autotable`
- **AI Integration**: Server-side Google Gemini Developer API

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)

### Installation

1. Clone or download this project.
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variable template:
   - Create a `.env` file in the root folder.
   - Declare your `GEMINI_API_KEY`:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

### Running the App

- **Development Server**: Launches both the React frontend and Express server under standard dev bindings.
  ```bash
  npm run dev
  ```
- **Production Build**: Compiles both backend assets to `dist/server.cjs` and static files to `dist/`.
  ```bash
  npm run build
  npm run start
  ```

---

## 📁 Project Structure

- `/src`: Modern React layout controllers, pages, and modular utility engines.
  - `/src/components`: Dashboard, AI Advisor, Forecast, CSV Importer, Header, and Auth views.
  - `/src/utils`: PDF generation core and helper tools.
- `/server`: Node Express API backend, SQLite connection drivers, and ML vectorizer setups.
- `server.ts`: Custom development and production runner.
- `metadata.json`: Application registry guidelines.
- `finlytics.db`: Active SQLite ledger workspace.
