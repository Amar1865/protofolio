import { Download, FileSpreadsheet, FileText, Loader2, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { FadeSlideIn } from '../components/MotionPrimitives';
import {
  AlertBanner,
  DashboardSkeleton,
  EmptyPortfolioState,
} from '../components/StatusFeedback';
import { apiClient, PortfolioReportResponse } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/calculations';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<PortfolioReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'csv' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPortfolioReport();
      setReport(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to generate portfolio report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
    const handleUpdate = () => {
      void loadReport();
    };
    window.addEventListener('portfolio:updated', handleUpdate);
    return () => {
      window.removeEventListener('portfolio:updated', handleUpdate);
    };
  }, [loadReport]);

  const handleDownload = async (format: 'pdf' | 'csv') => {
    setDownloadingFormat(format);
    setError(null);
    setFeedback(null);
    try {
      const { blob, filename } = await apiClient.downloadPortfolioReport(format);
      triggerBlobDownload(blob, filename);
      setFeedback(
        format === 'pdf'
          ? 'Portfolio valuation report downloaded as PDF.'
          : 'Portfolio valuation report downloaded as CSV.'
      );
    } catch (err: any) {
      setError(err?.message || `Unable to export ${format.toUpperCase()} report.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handlePrintStatement = async () => {
    await apiClient.logReportExport('Print Preview').catch(() => {});
    window.print();
  };

  const investor = report?.investor;
  const summary = report?.summary;
  const holdings = report?.holdings ?? [];
  const currency = investor?.currency || 'USD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
        title="Portfolio Reports"
        breadcrumb="Reporting / Generate & Export"
        actions={
          report ? (
            <div className="no-print flex items-center gap-2">
              <button
                type="button"
                disabled={downloadingFormat !== null}
                onClick={() => handleDownload('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0B1F3A] bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {downloadingFormat === 'csv' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                disabled={downloadingFormat !== null}
                onClick={() => handleDownload('pdf')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {downloadingFormat === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Download PDF</span>
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {feedback && (
            <div className="no-print">
              <AlertBanner
                type="success"
                message={feedback}
                onDismiss={() => setFeedback(null)}
              />
            </div>
          )}
          {error && (
            <div className="no-print">
              <AlertBanner
                type="error"
                message={error}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : !report || !investor || !summary ? (
            <EmptyPortfolioState />
          ) : (
            <>
              {/* Export Action Cards */}
              <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
                <FadeSlideIn
                  delay={0.04}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                      Download PDF Statement
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Generates a formatted institutional PDF file containing investor
                      details, holdings valuation, profit/loss, return %, and portfolio
                      allocation.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingFormat !== null}
                    onClick={() => handleDownload('pdf')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors disabled:opacity-60"
                  >
                    {downloadingFormat === 'pdf' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>
                      {downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
                    </span>
                  </button>
                </FadeSlideIn>

                <FadeSlideIn
                  delay={0.08}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                      Download CSV Spreadsheet
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Exports investor details, summary metrics, all holding columns, and
                      category allocation percentages ready for Excel or tax software.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingFormat !== null}
                    onClick={() => handleDownload('csv')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60"
                  >
                    {downloadingFormat === 'csv' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    <span>
                      {downloadingFormat === 'csv' ? 'Preparing CSV...' : 'Download CSV'}
                    </span>
                  </button>
                </FadeSlideIn>

                <FadeSlideIn
                  delay={0.12}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                      Print Statement View
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Print the executive portfolio statement preview directly from your
                      browser using clean print layout styling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintStatement}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Statement</span>
                  </button>
                </FadeSlideIn>
              </div>

              {/* Complete Report Preview */}
              <FadeSlideIn
                delay={0.14}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8"
              >
                {/* Investor Details Header */}
                <div className="pb-6 border-b border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">
                        Authenticated Investor Portfolio Report
                      </p>
                      <h2 className="font-display text-2xl font-bold text-[#0B1F3A] mt-1">
                        {investor.fullName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Only records owned by your authenticated account are included in
                        this report.
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500">Statement Date</p>
                      <p className="font-mono-num text-sm font-semibold text-[#0B1F3A] mt-0.5">
                        {report.statementDate}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-[11px] text-slate-500">Email Address</p>
                      <p className="text-xs font-semibold text-[#0B1F3A] mt-0.5 break-all">
                        {investor.email}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-[11px] text-slate-500">Phone</p>
                      <p className="text-xs font-semibold text-[#0B1F3A] mt-0.5">
                        {investor.phone}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-[11px] text-slate-500">
                        Risk Profile &amp; Currency
                      </p>
                      <p className="text-xs font-semibold text-[#0B1F3A] mt-0.5">
                        {investor.riskProfile} · {currency}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-[11px] text-slate-500">
                        Account ID / Member Since
                      </p>
                      <p className="font-mono-num text-xs font-semibold text-[#0B1F3A] mt-0.5">
                        #INV-{investor.id} · {investor.memberSince}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Portfolio Summary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">Total Invested Value</p>
                    <p className="font-mono-num text-lg font-semibold text-[#0B1F3A] mt-1">
                      {formatCurrency(summary.totalInvestment, currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">Current Portfolio Value</p>
                    <p className="font-mono-num text-lg font-semibold text-[#0B1F3A] mt-1">
                      {formatCurrency(summary.currentPortfolioValue, currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">
                      {summary.netGainLoss >= 0 ? 'Total Net Profit' : 'Total Net Loss'}
                    </p>
                    <p
                      className={`font-mono-num text-lg font-semibold mt-1 ${
                        summary.netGainLoss >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {summary.netGainLoss >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(summary.netGainLoss), currency)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">Return Percentage</p>
                    <p
                      className={`font-mono-num text-lg font-semibold mt-1 ${
                        summary.returnPercentage >= 0
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPercent(summary.returnPercentage)}
                    </p>
                  </div>
                </div>

                {/* Complete Holdings Report Table */}
                {holdings.length === 0 ? (
                  <EmptyPortfolioState />
                ) : (
                  <>
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#0B1F3A] mb-3">
                        Holdings Valuation Details
                      </h3>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                              <th className="py-3 px-3">Category</th>
                              <th className="py-3 px-3">Asset Name</th>
                              <th className="py-3 px-3">Symbol</th>
                              <th className="py-3 px-3 text-right">Units</th>
                              <th className="py-3 px-3 text-right">Purchase Price</th>
                              <th className="py-3 px-3 text-right">Current Price</th>
                              <th className="py-3 px-3 text-right">Invested Value</th>
                              <th className="py-3 px-3 text-right">Current Value</th>
                              <th className="py-3 px-3 text-right">Profit / Loss</th>
                              <th className="py-3 px-3 text-right">Return %</th>
                              <th className="py-3 px-3 text-right">Allocation %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {holdings.map((h) => {
                              const isGain = h.netGainLoss >= 0;
                              return (
                                <tr key={h.id} className="hover:bg-slate-50/70">
                                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                    {h.category}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-[#0B1F3A]">
                                    {h.assetName}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                    {h.symbol || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">
                                    {h.units.toLocaleString('en-US', {
                                      maximumFractionDigits: 4,
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">
                                    {formatCurrency(h.purchasePrice, currency)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">
                                    {formatCurrency(h.currentPrice, currency)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">
                                    {formatCurrency(h.investmentValue, currency)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono-num font-medium text-[#0B1F3A]">
                                    {formatCurrency(h.currentValue, currency)}
                                  </td>
                                  <td
                                    className={`py-2.5 px-3 text-right font-mono-num font-medium whitespace-nowrap ${
                                      isGain ? 'text-emerald-700' : 'text-red-600'
                                    }`}
                                  >
                                    {isGain ? '+' : '-'}
                                    {formatCurrency(Math.abs(h.netGainLoss), currency)}
                                  </td>
                                  <td
                                    className={`py-2.5 px-3 text-right font-mono-num font-semibold ${
                                      isGain ? 'text-emerald-700' : 'text-red-600'
                                    }`}
                                  >
                                    {formatPercent(h.returnPercentage)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono-num font-medium text-[#0B1F3A]">
                                    {h.portfolioShare.toFixed(2)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-200 text-xs sm:text-sm font-semibold text-[#0B1F3A]">
                              <td className="py-3 px-3" colSpan={6}>
                                Portfolio Total ({summary.holdingsCount} Holdings)
                              </td>
                              <td className="py-3 px-3 text-right font-mono-num">
                                {formatCurrency(summary.totalInvestment, currency)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono-num">
                                {formatCurrency(summary.currentPortfolioValue, currency)}
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-mono-num ${
                                  summary.netGainLoss >= 0
                                    ? 'text-emerald-700'
                                    : 'text-red-600'
                                }`}
                              >
                                {summary.netGainLoss >= 0 ? '+' : '-'}
                                {formatCurrency(Math.abs(summary.netGainLoss), currency)}
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-mono-num ${
                                  summary.returnPercentage >= 0
                                    ? 'text-emerald-700'
                                    : 'text-red-600'
                                }`}
                              >
                                {formatPercent(summary.returnPercentage)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono-num">
                                {summary.currentPortfolioValue > 0 ? '100.00%' : '0.00%'}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Portfolio Allocation Breakdown */}
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#0B1F3A] mb-3">
                        Portfolio Allocation by Category
                      </h3>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                              <th className="py-3 px-4">Investment Category</th>
                              <th className="py-3 px-4 text-right">Holdings</th>
                              <th className="py-3 px-4 text-right">Invested Value</th>
                              <th className="py-3 px-4 text-right">Current Value</th>
                              <th className="py-3 px-4 text-right">Profit / Loss</th>
                              <th className="py-3 px-4 text-right">Return %</th>
                              <th className="py-3 px-4 text-right">Portfolio Allocation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {summary.categoryAllocation.map((cat) => {
                              const catGain = cat.netGainLoss >= 0;
                              return (
                                <tr key={cat.category} className="hover:bg-slate-50/70">
                                  <td className="py-2.5 px-4 font-semibold text-[#0B1F3A]">
                                    {cat.category}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono-num text-slate-700">
                                    {cat.count}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono-num text-slate-700">
                                    {formatCurrency(cat.investedValue, currency)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono-num font-medium text-[#0B1F3A]">
                                    {formatCurrency(cat.currentValue, currency)}
                                  </td>
                                  <td
                                    className={`py-2.5 px-4 text-right font-mono-num font-medium ${
                                      catGain ? 'text-emerald-700' : 'text-red-600'
                                    }`}
                                  >
                                    {catGain ? '+' : '-'}
                                    {formatCurrency(Math.abs(cat.netGainLoss), currency)}
                                  </td>
                                  <td
                                    className={`py-2.5 px-4 text-right font-mono-num font-semibold ${
                                      catGain ? 'text-emerald-700' : 'text-red-600'
                                    }`}
                                  >
                                    {formatPercent(cat.returnPercentage)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-[#0B1F3A]">
                                    {cat.allocationPercentage.toFixed(2)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </FadeSlideIn>
            </>
          )}
        </div>
      </DashboardLayout>
    </motion.div>
  );
};
