import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardStats, Transaction } from "../types";

/**
 * Generates and downloads a beautifully formatted, highly professional PDF report
 * of the user's dashboard metrics and transaction logs.
 */
export function exportDashboardToPDF(
  stats: DashboardStats,
  transactions: Transaction[],
  user: { name: string; email: string }
) {
  // Initialize standard letter size PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Color Palette (Finlytics Premium Slate Theme)
  const colors: { [key: string]: [number, number, number] } = {
    primary: [30, 41, 59],      // Dark Slate (Slate-800)
    secondary: [79, 70, 229],   // Indigo-600
    textDark: [15, 23, 42],     // Slate-900
    textMuted: [100, 116, 139], // Slate-500
    border: [226, 232, 240],    // Slate-200
    bgLight: [248, 250, 252],   // Slate-50
    red: [220, 38, 38],         // Red-600
    green: [16, 185, 129],      // Emerald-500
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const drawPageHeader = (pageNumber: number) => {
    // Top Accent Bar
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 4, "F");

    // Corporate Logo / Branding
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text("FINLYTICS AI", 15, 15);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("INTELLIGENT WEALTH & RISK SUITE", 15, 19);

    // Document Name & Page
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text("FINANCIAL HEALTH & AUDIT DOSSIER", pageWidth - 15, 15, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`Page ${pageNumber}`, pageWidth - 15, 19, { align: "right" });

    // Thin grey separator line
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 23, pageWidth - 15, 23);
  };

  const drawPageFooter = (pageNumber: number) => {
    // Bottom thin line
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    // Footer copyright / notice
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Finlytics AI Sandbox Statement Audit Core • Confidential Client Report", 15, pageHeight - 10);
    doc.text(
      "Processed using sandbox TF-IDF Vectorizers & Isolation Forest anomalies baselines.",
      pageWidth - 15,
      pageHeight - 10,
      { align: "right" }
    );
  };

  // --- PAGE 1: EXECUTIVE BRIEFING ---
  drawPageHeader(1);

  // Report metadata / Client context
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.text("Financial Intelligence Briefing", 15, 33);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(`Report Subject: ${user.name} (${user.email})`, 15, 38);
  doc.text(`Statement Audit Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 15, 42);

  // Executive Scorecard Grid using AutoTable for perfect formatting
  autoTable(doc, {
    startY: 48,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: {
      font: "Helvetica",
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: colors.textMuted, cellWidth: 45 },
      1: { fontStyle: "bold", textColor: colors.textDark, cellWidth: 45 },
      2: { fontStyle: "bold", textColor: colors.textMuted, cellWidth: 45 },
      3: { fontStyle: "bold", textColor: colors.textDark, cellWidth: 45 },
    },
    body: [
      [
        "Total Cash Inflow",
        formatUSD(stats.totalIncome),
        "Financial Health Score",
        `${stats.financialHealth} / 100`,
      ],
      [
        "Total Cash Outflow",
        formatUSD(stats.totalSpending),
        "Savings Rate Indicator",
        `${stats.savingsRate}%`,
      ],
      [
        "Net Capital Saved",
        formatUSD(stats.totalSavings),
        "Unusual Risk Index",
        `${stats.riskScore} / 100`,
      ],
    ],
    didParseCell: (data) => {
      // Add subtle background coloring or border styling if desired
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = colors.bgLight;
      }
    }
  });

  // Section: Spending Allocation
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const scorecardFinalY = (doc as any).lastAutoTable.finalY || 80;
  doc.text("Spending Allocation & Structural Outlays", 15, scorecardFinalY + 10);

  // Category Table
  autoTable(doc, {
    startY: scorecardFinalY + 14,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      font: "Helvetica",
      fontSize: 9,
    },
    head: [["Category", "Allocated Outflow", "Outlay Ratio (%)"]],
    body: stats.categoryBreakdown.map((cat) => [
      cat.category,
      formatUSD(cat.amount),
      `${cat.percentage}%`,
    ]),
  });

  // Top Merchant Insight
  const categoryFinalY = (doc as any).lastAutoTable.finalY || 130;
  
  const largestCatText = stats.largestCategory 
    ? `Your top spending channel is ${stats.largestCategory.category} with structural outlays of ${formatUSD(stats.largestCategory.amount)} (${stats.largestCategory.percentage}%).` 
    : "No distinct category spending has been recorded.";

  const merchantText = stats.topMerchant 
    ? `Your single largest merchant volume is at ${stats.topMerchant.name} with cumulative transactions of ${formatUSD(stats.topMerchant.amount)}.`
    : "No dominant merchant has been isolated.";

  const anomalyText = `Our Isolation Forest flagged ${stats.anomaliesCount} anomalies. Clean records reduce volatility scores and safeguard health indexes.`;

  const maxTextWidth = pageWidth - 40;
  const lines1 = doc.splitTextToSize(`${largestCatText} ${merchantText}`, maxTextWidth);
  const lines2 = doc.splitTextToSize(anomalyText, maxTextWidth);

  // Dynamic layout calculations
  const lineHeight = 4.2;
  const paddingBefore = 5;
  const titleHeight = 5;
  const paragraphGap = 3;
  const paddingAfter = 5;

  const textHeight1 = lines1.length * lineHeight;
  const textHeight2 = lines2.length * lineHeight;
  const totalBoxHeight = paddingBefore + titleHeight + textHeight1 + paragraphGap + textHeight2 + paddingAfter;

  // Draw background box with dynamic height
  doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.rect(15, categoryFinalY + 6, pageWidth - 30, totalBoxHeight, "FD");

  // Draw Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text("AUDIT INTELLIGENCE NOTES", 20, categoryFinalY + 6 + paddingBefore + 3.5);

  // Draw Paragraph 1
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  let currentY = categoryFinalY + 6 + paddingBefore + titleHeight + 3.5;
  doc.text(lines1, 20, currentY);

  // Draw Paragraph 2
  currentY += textHeight1 + paragraphGap;
  doc.text(lines2, 20, currentY);

  drawPageFooter(1);

  // --- PAGE 2: LEDGER AUDIT ---
  doc.addPage();
  drawPageHeader(2);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Verified Ledger Transaction Logs", 15, 33);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("The following is the audited transaction list. Outliers flagged by Finlytics ML Isolation Forest are marked.", 15, 37);

  // Transactions list
  const maxRowsOnPage2 = 28;
  const showTxs = transactions.slice(0, maxRowsOnPage2);

  autoTable(doc, {
    startY: 42,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      font: "Helvetica",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Date
      1: { cellWidth: 85 }, // Description
      2: { cellWidth: 30 }, // Category
      3: { cellWidth: 25, halign: "right" }, // Amount
      4: { cellWidth: 20, halign: "center" }, // Status/Anomaly
    },
    head: [["Date", "Description / Payee", "Category", "Amount", "ML Audit"]],
    body: showTxs.map((tx) => [
      tx.date,
      tx.description,
      tx.category,
      tx.isIncome ? `+${formatUSD(Math.abs(tx.amount))}` : `-${formatUSD(Math.abs(tx.amount))}`,
      tx.isAnomaly ? "⚠️ OUTLIER" : "NORMAL",
    ]),
    didParseCell: (data) => {
      if (data.column.index === 4 && data.cell.text[0] === "⚠️ OUTLIER") {
        data.cell.styles.textColor = colors.red;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 3) {
        const rawAmount = data.row.raw[3] as string;
        if (rawAmount.startsWith("-")) {
          data.cell.styles.textColor = colors.textDark;
        } else {
          data.cell.styles.textColor = colors.green;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const txTableFinalY = (doc as any).lastAutoTable.finalY || 150;
  if (transactions.length > maxRowsOnPage2) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(
      `* Showing top ${maxRowsOnPage2} rows out of ${transactions.length} total transaction ledger records. Export limit is 1 page of records for layout consistency.`,
      15,
      txTableFinalY + 6
    );
  }

  drawPageFooter(2);

  // Trigger Save File
  const filename = `Finlytics_Financial_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
