import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { getInvestmentsForUser, logActivity, SafeUser } from '../db/queries.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import {
  computePortfolioAnalytics,
  formatCurrency,
  formatPercent,
  InvestmentCategory,
  InvestmentRecord,
} from '../utils/calculations.ts';

const router = Router();

interface ReportPayload {
  generatedAt: string;
  statementDate: string;
  investor: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    currency: string;
    riskProfile: string;
    memberSince: string;
  };
  summary: ReturnType<typeof computePortfolioAnalytics>['summary'];
  holdings: ReturnType<typeof computePortfolioAnalytics>['holdings'];
}

async function buildAuthenticatedPortfolioReport(authUser: SafeUser): Promise<ReportPayload> {
  const rows = await getInvestmentsForUser(authUser.id);
  const records: InvestmentRecord[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    category: r.category as InvestmentCategory,
    assetName: r.assetName,
    symbol: r.symbol,
    units: Number(r.units),
    purchasePrice: Number(r.purchasePrice),
    currentPrice: Number(r.currentPrice),
    purchaseDate: r.purchaseDate,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const { holdings, summary } = computePortfolioAnalytics(records);
  const now = new Date();

  return {
    generatedAt: now.toISOString(),
    statementDate: now.toISOString().slice(0, 10),
    investor: {
      id: authUser.id,
      fullName: authUser.fullName,
      email: authUser.email,
      phone: authUser.phone || 'Not provided',
      role: authUser.role,
      currency: authUser.currency || 'USD',
      riskProfile: authUser.riskProfile || 'Balanced',
      memberSince: authUser.createdAt.toISOString().slice(0, 10),
    },
    summary,
    holdings,
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function buildPortfolioCsv(report: ReportPayload): string {
  const { investor, summary, holdings, statementDate, generatedAt } = report;
  const rows: Array<Array<string | number>> = [];

  rows.push(['PortfolioVault — Personal Investment Portfolio Report']);
  rows.push(['Generated At (UTC)', generatedAt]);
  rows.push([]);

  rows.push(['INVESTOR DETAILS']);
  rows.push(['Investor Name', investor.fullName]);
  rows.push(['Email Address', investor.email]);
  rows.push(['Phone', investor.phone]);
  rows.push(['Account Role', investor.role.toUpperCase()]);
  rows.push(['Reporting Currency', investor.currency]);
  rows.push(['Risk Profile', investor.riskProfile]);
  rows.push(['Member Since', investor.memberSince]);
  rows.push(['Statement Date', statementDate]);
  rows.push([]);

  rows.push(['PORTFOLIO SUMMARY']);
  rows.push(['Total Invested Value', summary.totalInvestment.toFixed(2)]);
  rows.push(['Current Portfolio Value', summary.currentPortfolioValue.toFixed(2)]);
  rows.push(['Total Profit (Gross Gains)', summary.grossProfit.toFixed(2)]);
  rows.push(['Total Loss (Gross Losses)', summary.grossLoss.toFixed(2)]);
  rows.push(['Net Profit / Loss', summary.netGainLoss.toFixed(2)]);
  rows.push(['Return Percentage', `${summary.returnPercentage.toFixed(2)}%`]);
  rows.push(['Active Holdings Count', summary.holdingsCount]);
  rows.push([]);

  rows.push(['INVESTMENT HOLDINGS BREAKDOWN']);
  rows.push([
    'Investment Category',
    'Asset Name',
    'Symbol',
    'Purchase Date',
    'Units',
    'Purchase Price',
    'Current Price',
    'Invested Value',
    'Current Value',
    'Profit / Loss',
    'Return Percentage',
    'Portfolio Allocation (%)',
  ]);

  if (holdings.length === 0) {
    rows.push(['No investment records found for this investor account.']);
  } else {
    for (const h of holdings) {
      rows.push([
        h.category,
        h.assetName,
        h.symbol || '—',
        h.purchaseDate,
        h.units,
        h.purchasePrice.toFixed(2),
        h.currentPrice.toFixed(2),
        h.investmentValue.toFixed(2),
        h.currentValue.toFixed(2),
        h.netGainLoss.toFixed(2),
        `${h.returnPercentage.toFixed(2)}%`,
        `${h.portfolioShare.toFixed(2)}%`,
      ]);
    }

    rows.push([
      'TOTAL',
      `${summary.holdingsCount} Holdings`,
      '—',
      statementDate,
      '',
      '',
      '',
      summary.totalInvestment.toFixed(2),
      summary.currentPortfolioValue.toFixed(2),
      summary.netGainLoss.toFixed(2),
      `${summary.returnPercentage.toFixed(2)}%`,
      summary.currentPortfolioValue > 0 ? '100.00%' : '0.00%',
    ]);
  }

  rows.push([]);
  rows.push(['PORTFOLIO ALLOCATION BY CATEGORY']);
  rows.push([
    'Investment Category',
    'Holdings Count',
    'Invested Value',
    'Current Value',
    'Profit / Loss',
    'Return Percentage',
    'Portfolio Allocation (%)',
  ]);

  for (const cat of summary.categoryAllocation) {
    rows.push([
      cat.category,
      cat.count,
      cat.investedValue.toFixed(2),
      cat.currentValue.toFixed(2),
      cat.netGainLoss.toFixed(2),
      `${cat.returnPercentage.toFixed(2)}%`,
      `${cat.allocationPercentage.toFixed(2)}%`,
    ]);
  }

  return '\uFEFF' + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

function buildPortfolioPdfBuffer(report: ReportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 36,
      bufferPages: true,
      info: {
        Title: `Portfolio Report - ${report.investor.fullName} (${report.statementDate})`,
        Author: 'PortfolioVault',
        Subject: 'Personal Investment Portfolio Valuation Report',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    const { investor, summary, holdings, statementDate, generatedAt } = report;
    const currency = investor.currency || 'USD';
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftX = doc.page.margins.left;

    const NAVY = '#0B1F3A';
    const SLATE = '#475569';
    const MUTED = '#64748B';
    const BORDER = '#CBD5E1';
    const BG_LIGHT = '#F8FAFC';
    const EMERALD = '#15803D';
    const RED = '#DC2626';

    // Top Header Banner
    doc.rect(leftX, 32, pageWidth, 58).fill(NAVY);
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(17)
      .text('PortfolioVault — Investment Portfolio Report', leftX + 16, 44);
    doc
      .fillColor('#CBD5E1')
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Statement Date: ${statementDate}   |   Generated: ${generatedAt.replace('T', ' ').slice(0, 19)} UTC`,
        leftX + 16,
        68
      );
    doc
      .fillColor('#34D399')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(`Currency: ${currency}`, leftX + pageWidth - 130, 54, {
        width: 114,
        align: 'right',
      });

    // Investor Details Box
    let cursorY = 104;
    doc.roundedRect(leftX, cursorY, pageWidth, 64, 4).fillAndStroke(BG_LIGHT, BORDER);
    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text('INVESTOR DETAILS', leftX + 12, cursorY + 10);

    const detailColW = pageWidth / 4;
    const drawDetail = (col: number, row: number, label: string, value: string) => {
      const dx = leftX + 12 + col * detailColW;
      const dy = cursorY + 26 + row * 17;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(`${label}: `, dx, dy, {
        continued: true,
      });
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8).text(value, {
        width: detailColW - 22,
        ellipsis: true,
      });
    };

    drawDetail(0, 0, 'Name', investor.fullName);
    drawDetail(1, 0, 'Email', investor.email);
    drawDetail(2, 0, 'Phone', investor.phone);
    drawDetail(3, 0, 'Account ID', `#INV-${investor.id}`);

    drawDetail(0, 1, 'Role', investor.role.toUpperCase());
    drawDetail(1, 1, 'Risk Profile', investor.riskProfile);
    drawDetail(2, 1, 'Currency', currency);
    drawDetail(3, 1, 'Member Since', investor.memberSince);

    // KPI Summary Strip (5 cards)
    cursorY = 180;
    const cardGap = 8;
    const cardW = (pageWidth - cardGap * 4) / 5;
    const kpiCards = [
      {
        label: 'Total Invested',
        value: formatCurrency(summary.totalInvestment, currency),
        color: NAVY,
      },
      {
        label: 'Current Value',
        value: formatCurrency(summary.currentPortfolioValue, currency),
        color: NAVY,
      },
      {
        label: summary.netGainLoss >= 0 ? 'Net Profit' : 'Net Loss',
        value: `${summary.netGainLoss >= 0 ? '+' : '-'}${formatCurrency(
          Math.abs(summary.netGainLoss),
          currency
        )}`,
        color: summary.netGainLoss >= 0 ? EMERALD : RED,
      },
      {
        label: 'Return Percentage',
        value: formatPercent(summary.returnPercentage),
        color: summary.returnPercentage >= 0 ? EMERALD : RED,
      },
      {
        label: 'Active Holdings',
        value: String(summary.holdingsCount),
        color: NAVY,
      },
    ];

    kpiCards.forEach((card, idx) => {
      const cx = leftX + idx * (cardW + cardGap);
      doc.roundedRect(cx, cursorY, cardW, 46, 4).fillAndStroke('#FFFFFF', BORDER);
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(7.5)
        .text(card.label, cx + 10, cursorY + 8, { width: cardW - 20 });
      doc
        .fillColor(card.color)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(card.value, cx + 10, cursorY + 23, { width: cardW - 20 });
    });

    cursorY = 242;

    // Holdings Table Definition (total width matches pageWidth ~ 770pt on A4 landscape)
    const columns: Array<{
      header: string;
      width: number;
      align: 'left' | 'right';
    }> = [
      { header: 'Category', width: 68, align: 'left' },
      { header: 'Asset Name', width: 120, align: 'left' },
      { header: 'Symbol', width: 54, align: 'left' },
      { header: 'Units', width: 52, align: 'right' },
      { header: 'Buy Price', width: 68, align: 'right' },
      { header: 'Curr. Price', width: 68, align: 'right' },
      { header: 'Invested', width: 80, align: 'right' },
      { header: 'Current Val', width: 80, align: 'right' },
      { header: 'Profit / Loss', width: 78, align: 'right' },
      { header: 'Return %', width: 52, align: 'right' },
      { header: 'Alloc %', width: pageWidth - (68 + 120 + 54 + 52 + 68 + 68 + 80 + 80 + 78 + 52), align: 'right' },
    ];

    const drawHoldingsHeader = (y: number) => {
      doc.rect(leftX, y, pageWidth, 22).fill(NAVY);
      let x = leftX;
      columns.forEach((col) => {
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(col.header, x + 4, y + 7, {
            width: col.width - 8,
            align: col.align,
            lineBreak: false,
          });
        x += col.width;
      });
      return y + 22;
    };

    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text('HOLDINGS VALUATION STATEMENT', leftX, cursorY);
    cursorY += 16;

    if (holdings.length === 0) {
      doc.roundedRect(leftX, cursorY, pageWidth, 40, 4).fillAndStroke(BG_LIGHT, BORDER);
      doc
        .fillColor(SLATE)
        .font('Helvetica')
        .fontSize(9)
        .text(
          'No investment records are currently saved for this investor account.',
          leftX + 12,
          cursorY + 14
        );
      cursorY += 54;
    } else {
      cursorY = drawHoldingsHeader(cursorY);
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 36;

      holdings.forEach((h, idx) => {
        if (cursorY + 20 > bottomLimit) {
          doc.addPage();
          cursorY = doc.page.margins.top;
          cursorY = drawHoldingsHeader(cursorY);
        }

        const rowBg = idx % 2 === 1 ? BG_LIGHT : '#FFFFFF';
        doc.rect(leftX, cursorY, pageWidth, 20).fill(rowBg);
        doc
          .moveTo(leftX, cursorY + 20)
          .lineTo(leftX + pageWidth, cursorY + 20)
          .strokeColor('#E2E8F0')
          .lineWidth(0.5)
          .stroke();

        const isGain = h.netGainLoss >= 0;
        const pnlText = `${isGain ? '+' : '-'}${formatCurrency(
          Math.abs(h.netGainLoss),
          currency
        )}`;
        const values = [
          { text: h.category, color: '#0F172A', bold: false },
          { text: h.assetName, color: NAVY, bold: true },
          { text: h.symbol || '—', color: SLATE, bold: false },
          {
            text: h.units.toLocaleString('en-US', { maximumFractionDigits: 4 }),
            color: '#0F172A',
            bold: false,
          },
          { text: formatCurrency(h.purchasePrice, currency), color: '#0F172A', bold: false },
          { text: formatCurrency(h.currentPrice, currency), color: '#0F172A', bold: false },
          { text: formatCurrency(h.investmentValue, currency), color: '#0F172A', bold: false },
          { text: formatCurrency(h.currentValue, currency), color: NAVY, bold: true },
          { text: pnlText, color: isGain ? EMERALD : RED, bold: true },
          {
            text: formatPercent(h.returnPercentage),
            color: isGain ? EMERALD : RED,
            bold: true,
          },
          { text: `${h.portfolioShare.toFixed(2)}%`, color: '#0F172A', bold: false },
        ];

        let x = leftX;
        columns.forEach((col, cIdx) => {
          const cell = values[cIdx];
          doc
            .fillColor(cell.color)
            .font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(7.5)
            .text(cell.text, x + 4, cursorY + 6, {
              width: col.width - 8,
              align: col.align,
              ellipsis: true,
              lineBreak: false,
            });
          x += col.width;
        });

        cursorY += 20;
      });

      // Totals Row
      if (cursorY + 24 > bottomLimit) {
        doc.addPage();
        cursorY = doc.page.margins.top;
      }
      doc.rect(leftX, cursorY, pageWidth, 22).fill('#E2E8F0');
      const totalGain = summary.netGainLoss >= 0;
      const totalCells = [
        'TOTAL',
        `${summary.holdingsCount} Holdings`,
        '—',
        '',
        '',
        '',
        formatCurrency(summary.totalInvestment, currency),
        formatCurrency(summary.currentPortfolioValue, currency),
        `${totalGain ? '+' : '-'}${formatCurrency(Math.abs(summary.netGainLoss), currency)}`,
        formatPercent(summary.returnPercentage),
        summary.currentPortfolioValue > 0 ? '100.00%' : '0.00%',
      ];
      let tx = leftX;
      columns.forEach((col, cIdx) => {
        const color =
          cIdx === 8 || cIdx === 9 ? (totalGain ? EMERALD : RED) : NAVY;
        doc
          .fillColor(color)
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(totalCells[cIdx], tx + 4, cursorY + 7, {
            width: col.width - 8,
            align: col.align,
            lineBreak: false,
          });
        tx += col.width;
      });
      cursorY += 34;
    }

    // Category Allocation Breakdown Table
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 36;
    if (cursorY + 110 > bottomLimit) {
      doc.addPage();
      cursorY = doc.page.margins.top;
    }

    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text('PORTFOLIO ALLOCATION BY CATEGORY', leftX, cursorY);
    cursorY += 16;

    const allocCols: Array<{ header: string; width: number; align: 'left' | 'right' }> = [
      { header: 'Investment Category', width: 150, align: 'left' },
      { header: 'Holdings', width: 70, align: 'right' },
      { header: 'Invested Value', width: 120, align: 'right' },
      { header: 'Current Value', width: 120, align: 'right' },
      { header: 'Profit / Loss', width: 120, align: 'right' },
      { header: 'Return %', width: 90, align: 'right' },
      {
        header: 'Allocation %',
        width: pageWidth - (150 + 70 + 120 + 120 + 120 + 90),
        align: 'right',
      },
    ];

    doc.rect(leftX, cursorY, pageWidth, 20).fill(NAVY);
    let ax = leftX;
    allocCols.forEach((col) => {
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(col.header, ax + 6, cursorY + 6, {
          width: col.width - 12,
          align: col.align,
          lineBreak: false,
        });
      ax += col.width;
    });
    cursorY += 20;

    summary.categoryAllocation.forEach((cat, idx) => {
      doc.rect(leftX, cursorY, pageWidth, 20).fill(idx % 2 === 1 ? BG_LIGHT : '#FFFFFF');
      doc
        .moveTo(leftX, cursorY + 20)
        .lineTo(leftX + pageWidth, cursorY + 20)
        .strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .stroke();

      const catGain = cat.netGainLoss >= 0;
      const catCells = [
        { text: cat.category, color: NAVY, bold: true },
        { text: String(cat.count), color: '#0F172A', bold: false },
        { text: formatCurrency(cat.investedValue, currency), color: '#0F172A', bold: false },
        { text: formatCurrency(cat.currentValue, currency), color: NAVY, bold: true },
        {
          text: `${catGain ? '+' : '-'}${formatCurrency(Math.abs(cat.netGainLoss), currency)}`,
          color: catGain ? EMERALD : RED,
          bold: true,
        },
        {
          text: formatPercent(cat.returnPercentage),
          color: catGain ? EMERALD : RED,
          bold: true,
        },
        { text: `${cat.allocationPercentage.toFixed(2)}%`, color: NAVY, bold: true },
      ];

      let cx = leftX;
      allocCols.forEach((col, cIdx) => {
        const cell = catCells[cIdx];
        doc
          .fillColor(cell.color)
          .font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .text(cell.text, cx + 6, cursorY + 6, {
            width: col.width - 12,
            align: col.align,
            lineBreak: false,
          });
        cx += col.width;
      });
      cursorY += 20;
    });

    // Stamp Footers on All Pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 26;
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          `Confidential Investor Statement — Prepared exclusively for ${investor.fullName} (${investor.email})`,
          leftX,
          footerY,
          { width: pageWidth - 100, lineBreak: false }
        );
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Page ${i + 1} of ${range.count}`, leftX + pageWidth - 90, footerY, {
          width: 90,
          align: 'right',
          lineBreak: false,
        });
    }

    doc.end();
  });
}

router.use('/reports', requireAuth);

router.get('/reports/portfolio', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const report = await buildAuthenticatedPortfolioReport(req.authUser);
    return res.json(report);
  } catch (error: any) {
    console.error('Portfolio report JSON error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to generate portfolio report.' });
  }
});

router.get('/reports/portfolio/csv', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const report = await buildAuthenticatedPortfolioReport(req.authUser);
    const csvContent = buildPortfolioCsv(report);
    const filename = `portfolio-report-${report.statementDate}.csv`;

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'REPORT_EXPORTED',
      entityType: 'report',
      details: `Downloaded CSV portfolio report (${report.summary.holdingsCount} holdings).`,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(csvContent);
  } catch (error: any) {
    console.error('Portfolio report CSV error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to export CSV portfolio report.' });
  }
});

router.get('/reports/portfolio/pdf', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const report = await buildAuthenticatedPortfolioReport(req.authUser);
    const pdfBuffer = await buildPortfolioPdfBuffer(report);
    const filename = `portfolio-report-${report.statementDate}.pdf`;

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'REPORT_EXPORTED',
      entityType: 'report',
      details: `Downloaded PDF portfolio report (${report.summary.holdingsCount} holdings).`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Portfolio report PDF error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to generate PDF portfolio report.' });
  }
});

export default router;
