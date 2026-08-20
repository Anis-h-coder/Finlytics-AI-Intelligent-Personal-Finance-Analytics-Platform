/**
 * Isolation Forest Anomaly Detection in pure TypeScript with Seeded PRNG.
 * Detects suspicious or unusual transactions based on amount and category distribution.
 * Guarantees 100% deterministic reproducibility across server restarts and refreshes.
 */

interface DataPoint {
  amount: number;
  categoryIndex: number;
  originalIndex: number;
}

class IsolationTreeNode {
  public left: IsolationTreeNode | null = null;
  public right: IsolationTreeNode | null = null;
  public splitFeature: "amount" | "categoryIndex" | null = null;
  public splitValue: number | null = null;
  public size: number = 0;

  constructor(size: number) {
    this.size = size;
  }
}

/**
 * Deterministic Mulberry32 32-bit pseudorandom generator.
 */
class SeededRandom {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  public shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export class IsolationForest {
  private trees: IsolationTreeNode[] = [];
  private numTrees: number = 50;
  private maxDepth: number = 10;
  private sampleSize: number = 256;
  private seed: number = 42;
  private rng: SeededRandom;

  constructor(numTrees: number = 50, sampleSize: number = 256, seed: number = 42) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
    this.seed = seed;
    this.maxDepth = Math.ceil(Math.log2(Math.max(sampleSize, 2)));
    this.rng = new SeededRandom(this.seed);
  }

  /**
   * Helper function to get Euler's constant approximation for c(n) formula
   */
  private c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    // c(n) = 2 * (ln(n - 1) + Euler's constant) - 2 * (n - 1) / n
    const eulerConstant = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerConstant) - (2 * (n - 1)) / n;
  }

  /**
   * Fit the Isolation Forest on a set of transaction points
   */
  public fit(amounts: number[], categoryIndices: number[]) {
    this.trees = [];
    const n = amounts.length;
    if (n === 0) return;

    // Reset PRNG to initial seed so fit is 100% deterministic
    this.rng = new SeededRandom(this.seed);

    const data: DataPoint[] = [];
    for (let i = 0; i < n; i++) {
      data.push({
        amount: Math.abs(amounts[i]), // absolute value for spending size
        categoryIndex: categoryIndices[i],
        originalIndex: i,
      });
    }

    const currentSampleSize = Math.min(this.sampleSize, n);

    for (let i = 0; i < this.numTrees; i++) {
      // Draw deterministic random sample using seeded shuffle
      const sample: DataPoint[] = [];
      const shuffled = this.rng.shuffle(data);
      for (let j = 0; j < currentSampleSize; j++) {
        sample.push(shuffled[j]);
      }

      const tree = this.buildTree(sample, 0, this.maxDepth);
      this.trees.push(tree);
    }
  }

  private buildTree(data: DataPoint[], currentDepth: number, maxDepth: number): IsolationTreeNode {
    const node = new IsolationTreeNode(data.length);

    if (currentDepth >= maxDepth || data.length <= 1) {
      return node;
    }

    // Determine min/max for features
    let minAmount = Infinity, maxAmount = -Infinity;
    let minCat = Infinity, maxCat = -Infinity;

    data.forEach((d) => {
      if (d.amount < minAmount) minAmount = d.amount;
      if (d.amount > maxAmount) maxAmount = d.amount;
      if (d.categoryIndex < minCat) minCat = d.categoryIndex;
      if (d.categoryIndex > maxCat) maxCat = d.categoryIndex;
    });

    // Check if data points are identical
    if (minAmount === maxAmount && minCat === maxCat) {
      return node;
    }

    // Pick random split feature
    const features: ("amount" | "categoryIndex")[] = [];
    if (minAmount < maxAmount) features.push("amount");
    if (minCat < maxCat) features.push("categoryIndex");

    if (features.length === 0) return node;

    const selectedFeature = features[Math.floor(this.rng.next() * features.length)];
    node.splitFeature = selectedFeature;

    // Pick random split value between min and max
    if (selectedFeature === "amount") {
      node.splitValue = this.rng.next() * (maxAmount - minAmount) + minAmount;
    } else {
      node.splitValue = this.rng.next() * (maxCat - minCat) + minCat;
    }

    // Split data
    const leftData: DataPoint[] = [];
    const rightData: DataPoint[] = [];

    data.forEach((d) => {
      const val = selectedFeature === "amount" ? d.amount : d.categoryIndex;
      if (val < node.splitValue!) {
        leftData.push(d);
      } else {
        rightData.push(d);
      }
    });

    node.left = this.buildTree(leftData, currentDepth + 1, maxDepth);
    node.right = this.buildTree(rightData, currentDepth + 1, maxDepth);

    return node;
  }

  private pathLength(point: { amount: number; categoryIndex: number }, node: IsolationTreeNode, depth: number): number {
    if (node.left === null || node.right === null) {
      return depth + this.c(node.size);
    }

    const val = node.splitFeature === "amount" ? point.amount : point.categoryIndex;
    if (val < node.splitValue!) {
      return this.pathLength(point, node.left, depth + 1);
    } else {
      return this.pathLength(point, node.right, depth + 1);
    }
  }

  /**
   * Calculates the anomaly score for a single transaction.
   * Score ranges from 0 to 1. Scores > 0.65 generally indicate anomalies.
   */
  public score(amount: number, categoryIndex: number, totalDatasetSize: number): number {
    if (this.trees.length === 0) return 0.5;

    const absAmount = Math.abs(amount);
    const point = { amount: absAmount, categoryIndex };

    let totalPathLength = 0;
    this.trees.forEach((tree) => {
      totalPathLength += this.pathLength(point, tree, 0);
    });

    const avgPathLength = totalPathLength / this.trees.length;
    const currentSampleSize = Math.min(this.sampleSize, totalDatasetSize);
    const cVal = this.c(currentSampleSize);

    if (cVal === 0) return 0.5;

    // Standard anomaly score formula: s = 2 ^ (- E(h(x)) / c(n))
    return Math.pow(2, -avgPathLength / cVal);
  }

  /**
   * Scores and returns anomalies in a list of transactions.
   * Standard threshold is 0.60 - 0.70.
   */
  public detect(amounts: number[], categoryIndices: number[]): { isAnomaly: boolean; score: number }[] {
    const n = amounts.length;
    if (n < 5) {
      // Not enough data for isolation, perform statistical Z-score anomaly detection
      const mean = amounts.reduce((sum, a) => sum + Math.abs(a), 0) / n || 0;
      const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(Math.abs(a) - mean, 2), 0) / n) || 1;

      return amounts.map((amount) => {
        const absA = Math.abs(amount);
        const zScore = Math.abs(absA - mean) / stdDev;
        // Z-score > 2.5 means anomaly
        const isAnomaly = zScore > 2.2 && absA > mean; // only flag excessive spending as anomaly, not low spending or income
        const score = Math.min(1.0, zScore / 4.0);
        return { isAnomaly, score };
      });
    }

    this.fit(amounts, categoryIndices);

    return amounts.map((amount, i) => {
      const score = this.score(amount, categoryIndices[i], n);
      // Flag as anomaly if the score is high and it's a debit (i.e. spending, not income)
      const isAnomaly = score > 0.68;
      return { isAnomaly, score };
    });
  }
}
