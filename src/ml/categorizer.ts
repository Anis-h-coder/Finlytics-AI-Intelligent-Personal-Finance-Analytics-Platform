/**
 * ML-Based Auto Categorization using TF-IDF + Logistic Regression in pure TypeScript.
 * Classifies transactions into: Food, Transport, Shopping, Income, Utilities
 */

interface TrainingSample {
  text: string;
  category: string;
}

const TRAINING_DATA: TrainingSample[] = [
  // Income
  { text: "salary deposit company corp", category: "Income" },
  { text: "monthly payroll paycheck", category: "Income" },
  { text: "direct deposit payroll payout", category: "Income" },
  { text: "freelance project software payment", category: "Income" },
  { text: "consulting services bank transfer inbound", category: "Income" },
  { text: "dividend payment investments", category: "Income" },
  { text: "interest payment savings account", category: "Income" },
  { text: "venmo cashout transfer from friend", category: "Income" },

  // Food
  { text: "whole foods grocery store supermarket", category: "Food" },
  { text: "starbucks coffee cafe latte", category: "Food" },
  { text: "mcdonalds fast food burger fries", category: "Food" },
  { text: "ubereats delivery food order", category: "Food" },
  { text: "dinner at restaurant bar grill", category: "Food" },
  { text: "pizza hut delivery order dinner", category: "Food" },
  { text: "trader joes market organic vegetables", category: "Food" },
  { text: "walmart supermarket grocery shopping", category: "Food" },
  { text: "bakery bread croissant breakfast", category: "Food" },
  { text: "subway sandwich lunch grill", category: "Food" },

  // Transport
  { text: "uber ride hailing taxi trip", category: "Transport" },
  { text: "lyft ride ride-share passenger", category: "Transport" },
  { text: "shell gas station petroleum refuel", category: "Transport" },
  { text: "chevron gas station fuel fill-up", category: "Transport" },
  { text: "metro train subway transit pass", category: "Transport" },
  { text: "bus fare ticket public transit", category: "Transport" },
  { text: "parking garage fee parking ticket", category: "Transport" },
  { text: "amtrack train travel railway ticket", category: "Transport" },
  { text: "car rental deposit wheels", category: "Transport" },

  // Shopping
  { text: "amazon prime online retail order", category: "Shopping" },
  { text: "target store retail store shopping department", category: "Shopping" },
  { text: "walmart supercenter clothing general items", category: "Shopping" },
  { text: "nike shoes retail store outfit", category: "Shopping" },
  { text: "best buy electronics laptop headphones", category: "Shopping" },
  { text: "ebay online auction purchase bidding", category: "Shopping" },
  { text: "h&m apparel clothing shoes shopping mall", category: "Shopping" },
  { text: "sephora makeup cosmetics beauty care", category: "Shopping" },
  { text: "apple store digital purchase subscription app", category: "Shopping" },

  // Utilities
  { text: "electric utility power bill energy grid", category: "Utilities" },
  { text: "municipal water waste utility bill sewer", category: "Utilities" },
  { text: "comcast xfinity high speed internet wifi cable", category: "Utilities" },
  { text: "at&t mobile wireless phone subscription", category: "Utilities" },
  { text: "verizon mobile telecom invoice bill", category: "Utilities" },
  { text: "netflix monthly entertainment streaming", category: "Utilities" },
  { text: "spotify premium music stream audio service", category: "Utilities" },
  { text: "waste management trash garbage collection utility", category: "Utilities" },
  { text: "gas natural heating energy invoice bill", category: "Utilities" },
];

export class Categorizer {
  private vocabulary: string[] = [];
  private idf: { [key: string]: number } = {};
  private categories: string[] = ["Food", "Transport", "Shopping", "Income", "Utilities"];
  // Weights for Logistic Regression (one model per category: One-vs-Rest)
  // key: category name, value: array of weights corresponding to vocabulary length
  private weights: { [category: string]: number[] } = {};
  private bias: { [category: string]: number } = {};

  constructor() {
    this.train();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2); // filter short words
  }

  private train() {
    // 1. Build Vocabulary and calculate IDF
    const totalDocs = TRAINING_DATA.length;
    const docWordCounts: { [word: string]: number } = {};

    TRAINING_DATA.forEach((sample) => {
      const tokens = Array.from(new Set(this.tokenize(sample.text)));
      tokens.forEach((token) => {
        docWordCounts[token] = (docWordCounts[token] || 0) + 1;
      });
    });

    // Keep words that appear in at least 1 document
    this.vocabulary = Object.keys(docWordCounts);

    this.vocabulary.forEach((word) => {
      // Standard IDF formula: log(totalDocs / (docs containing word))
      this.idf[word] = Math.log(totalDocs / docWordCounts[word]) + 0.1;
    });

    // Initialize Logistic Regression weights
    const vocabSize = this.vocabulary.length;
    this.categories.forEach((category) => {
      this.weights[category] = new Array(vocabSize).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      this.bias[category] = 0;
    });

    // 2. Convert training data to TF-IDF vectors
    const X: number[][] = TRAINING_DATA.map((sample) => this.vectorize(sample.text));

    // 3. Train One-vs-Rest Logistic Regression models using simple Gradient Descent
    const epochs = 150;
    const learningRate = 0.5;

    this.categories.forEach((category) => {
      const y = TRAINING_DATA.map((sample) => (sample.category === category ? 1 : 0));
      const w = this.weights[category];
      let b = this.bias[category];

      for (let epoch = 0; epoch < epochs; epoch++) {
        for (let i = 0; i < X.length; i++) {
          const xi = X[i];
          const yi = y[i];

          // Linear combination: z = w.x + b
          let z = b;
          for (let j = 0; j < vocabSize; j++) {
            z += xi[j] * w[j];
          }

          // Sigmoid: prediction = 1 / (1 + e^-z)
          const prediction = 1 / (1 + Math.exp(-z));

          // Gradient: error = prediction - actual
          const error = prediction - yi;

          // Update weights and bias
          for (let j = 0; j < vocabSize; j++) {
            w[j] -= learningRate * error * xi[j];
          }
          b -= learningRate * error;
        }
      }

      this.weights[category] = w;
      this.bias[category] = b;
    });
  }

  private vectorize(text: string): number[] {
    const tokens = this.tokenize(text);
    const vector = new Array(this.vocabulary.length).fill(0);

    if (tokens.length === 0) return vector;

    // Term counts
    const termCounts: { [word: string]: number } = {};
    tokens.forEach((t) => {
      termCounts[t] = (termCounts[t] || 0) + 1;
    });

    this.vocabulary.forEach((word, idx) => {
      if (termCounts[word]) {
        const tf = termCounts[word] / tokens.length;
        const idf = this.idf[word] || 0;
        vector[idx] = tf * idf;
      }
    });

    return vector;
  }

  /**
   * Automatically classifies a description into one of the categories.
   */
  public categorize(description: string): string {
    const vector = this.vectorize(description);
    let bestCategory = "Shopping"; // Fallback category
    let maxProb = -1;

    // Evaluate each model's probability
    const probs: { [cat: string]: number } = {};
    this.categories.forEach((category) => {
      const w = this.weights[category];
      const b = this.bias[category];

      let z = b;
      for (let j = 0; j < this.vocabulary.length; j++) {
        z += vector[j] * w[j];
      }

      const prob = 1 / (1 + Math.exp(-z));
      probs[category] = prob;

      if (prob > maxProb) {
        maxProb = prob;
        bestCategory = category;
      }
    });

    // Hardcoded rules / keyword matching override for guaranteed high-quality experience
    const descLower = description.toLowerCase();
    if (descLower.includes("salary") || descLower.includes("paycheck") || descLower.includes("dividend") || descLower.includes("direct deposit") || descLower.includes("freelance") || descLower.includes("income") || descLower.includes("payout")) {
      return "Income";
    }
    if (descLower.includes("restaurant") || descLower.includes("cafe") || descLower.includes("starbucks") || descLower.includes("food") || descLower.includes("grocery") || descLower.includes("grocery") || descLower.includes("supermarket") || descLower.includes("pizza") || descLower.includes("mcdonald") || descLower.includes("eats") || descLower.includes("trader jo")) {
      return "Food";
    }
    if (descLower.includes("uber") || descLower.includes("lyft") || descLower.includes("gas") || descLower.includes("shell") || descLower.includes("chevron") || descLower.includes("subway") || descLower.includes("metro") || descLower.includes("bus") || descLower.includes("train") || descLower.includes("parking") || descLower.includes("transit")) {
      return "Transport";
    }
    if (descLower.includes("electric") || descLower.includes("water") || descLower.includes("internet") || descLower.includes("comcast") || descLower.includes("utility") || descLower.includes("utilities") || descLower.includes("bill") || descLower.includes("netflix") || descLower.includes("spotify") || descLower.includes("mobile") || descLower.includes("phone")) {
      return "Utilities";
    }
    if (descLower.includes("amazon") || descLower.includes("target") || descLower.includes("walmart") || descLower.includes("nike") || descLower.includes("best buy") || descLower.includes("ebay") || descLower.includes("shoes") || descLower.includes("clothing") || descLower.includes("store")) {
      return "Shopping";
    }

    return bestCategory;
  }
}
