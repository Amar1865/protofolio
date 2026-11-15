import { motion } from 'motion/react';
import React, { useCallback } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../components/DashboardLayout';
import { AnimatedNumber, FadeSlideIn } from '../components/MotionPrimitives';
import {
  AlertBanner,
  DashboardSkeleton,
  EmptyPortfolioState,
} from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent } from '../utils/calculations';

export const ProfitLossPage: React.FC = () => {
  const { user } = useAuth();
  const { holdings, summary, loading, error } = usePortfolio();
  const currency = user?.currency || 'USD';

  const grossProfit = summary.grossProfit;
  const grossLoss = summary.grossLoss;
  const netGainLoss = summary.netGainLoss;

  const fmtProfit = useCallback(
    (v: number) => `+${formatCurrency(v, currency)}`,
    [currency]
  );
  const fmtLoss = useCallback(
    (v: number) => `-${formatCurrency(v, currency)}`,
    [currency]
  );
  const fmtNet = useCallback(
    (v: number) => `${netGainLoss >= 0 ? '+' : '-'}${formatCurrency(v, currency)}`,
    [netGainLoss, currency]
  );
  const fmtPct = useCallback((v: number) => formatPercent(v), []);

  const chartData = holdings.map((h) => ({
    id: h.id,
    symbol: h.symbol || h.assetName.slice(0, 14),
    netGainLoss: h.netGainLoss,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
      title="Profit and Loss"
      breadcrumb="Analytics / Profit and Loss"
    >
      {error && (
        <div className="mb-6">
          <AlertBanner type="error" message={error} />
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : holdings.length === 0 ? (
        <EmptyPortfolioState />
      ) : (
        <div className="space-y-6">
          {/* P&L KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs font-medium text-slate-500">Gross Profit</p>
              <p className="font-mono-num text-2xl font-semibold text-emerald-700 mt-2">
                <AnimatedNumber value={grossProfit} formatter={fmtProfit} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Sum of positive positions
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs font-medium text-slate-500">Gross Loss</p>
              <p className="font-mono-num text-2xl font-semibold text-red-600 mt-2">
                <AnimatedNumber value={grossLoss} formatter={fmtLoss} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Sum of drawdown positions
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs font-medium text-slate-500">
                {netGainLoss >= 0 ? 'Net Portfolio Profit' : 'Net Portfolio Loss'}
              </p>
              <p
                className={`font-mono-num text-2xl font-semibold mt-2 ${
                  netGainLoss >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                <AnimatedNumber value={Math.abs(netGainLoss)} formatter={fmtNet} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Current Value minus Total Investment
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs font-medium text-slate-500">Overall Return %</p>
              <p
                className={`font-mono-num text-2xl font-semibold mt-2 ${
                  summary.returnPercentage >= 0
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                <AnimatedNumber value={summary.returnPercentage} formatter={fmtPct} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Weighted portfolio return
              </p>
            </motion.div>
          </div>

          {/* P&L Chart */}
          <FadeSlideIn
            delay={0.08}
            className="bg-white border border-slate-200 rounded-xl p-6"
          >
            <h2 className="font-display text-base font-semibold text-[#0B1F3A] mb-1">
              Net Profit / Loss by Holding
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Green bars indicate unrealized gains; red bars indicate unrealized losses
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="symbol" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                  <ReferenceLine y={0} stroke="#0B1F3A" />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0, currency)}
                  />
                  <Bar dataKey="netGainLoss" name="Net P&L" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.netGainLoss >= 0 ? '#15803D' : '#DC2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FadeSlideIn>

          {/* Detailed P&L Table */}
          <FadeSlideIn
            delay={0.14}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                Holding-Level Profit and Loss Statement
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Investment Value</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">Profit</th>
                    <th className="py-3 px-4 text-right">Loss</th>
                    <th className="py-3 px-4 text-right">Return %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {holdings.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {h.symbol ? (
                          <>
                            <span className="font-semibold text-[#0B1F3A]">{h.symbol}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              {h.assetName}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-[#0B1F3A]">
                            {h.assetName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{h.category}</td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        {formatCurrency(h.investmentValue, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-medium text-[#0B1F3A]">
                        {formatCurrency(h.currentValue, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-emerald-700 font-medium">
                        {h.profit > 0 ? `+${formatCurrency(h.profit, currency)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-red-600 font-medium">
                        {h.loss > 0 ? `-${formatCurrency(h.loss, currency)}` : '—'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-num font-semibold ${
                          h.returnPercentage >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(h.returnPercentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeSlideIn>
        </div>
      )}
      </DashboardLayout>
    </motion.div>
  );
};
