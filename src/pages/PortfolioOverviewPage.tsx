import { motion } from 'motion/react';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  AlertBanner,
  DashboardSkeleton,
  EmptyPortfolioState,
} from '../components/StatusFeedback';
import { SummaryCards } from '../components/SummaryCards';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent } from '../utils/calculations';

export const PortfolioOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { holdings, summary, loading, error } = usePortfolio();
  const currency = user?.currency || 'USD';

  const chartData = holdings.map((h) => ({
    symbol: h.symbol || h.assetName.slice(0, 14),
    Invested: h.investmentValue,
    'Current Value': h.currentValue,
  }));

  const largestHolding =
    holdings.length > 0
      ? [...holdings].sort((a, b) => b.currentValue - a.currentValue)[0]
      : null;
  const topReturnHolding =
    holdings.length > 0
      ? [...holdings].sort((a, b) => b.returnPercentage - a.returnPercentage)[0]
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
      title="Portfolio Overview"
      breadcrumb="Analytics / Portfolio Overview"
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
          <SummaryCards summary={summary} currency={currency} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {largestHolding && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Largest Position by Market Value
                  </p>
                  <p className="font-display text-lg font-bold text-[#0B1F3A] mt-1">
                    {largestHolding.symbol
                      ? `${largestHolding.symbol} · ${largestHolding.assetName}`
                      : largestHolding.assetName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {largestHolding.category} · {largestHolding.portfolioShare.toFixed(2)}%
                    of portfolio
                  </p>
                </div>
                <p className="font-mono-num text-xl font-semibold text-[#0B1F3A]">
                  {formatCurrency(largestHolding.currentValue, currency)}
                </p>
              </div>
            )}

            {topReturnHolding && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Highest Return Holding
                  </p>
                  <p className="font-display text-lg font-bold text-[#0B1F3A] mt-1">
                    {topReturnHolding.symbol
                      ? `${topReturnHolding.symbol} · ${topReturnHolding.assetName}`
                      : topReturnHolding.assetName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {topReturnHolding.category} · Purchased {topReturnHolding.purchaseDate}
                  </p>
                </div>
                <p
                  className={`font-mono-num text-xl font-semibold ${
                    topReturnHolding.returnPercentage >= 0
                      ? 'text-emerald-700'
                      : 'text-red-600'
                  }`}
                >
                  {formatPercent(topReturnHolding.returnPercentage)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-[#0B1F3A] mb-1">
              Cost Basis vs. Current Valuation by Asset
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Holdings comparison across your active portfolio positions
            </p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="symbol" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0, currency)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Invested" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Current Value" fill="#15803D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                Consolidated Position Weights
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Units</th>
                    <th className="py-3 px-4 text-right">Cost Basis</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">Portfolio Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {holdings.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-[#0B1F3A]">
                        {h.symbol || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{h.assetName}</td>
                      <td className="py-3 px-4 text-slate-600">{h.category}</td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        {h.units.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        {formatCurrency(h.investmentValue, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A]">
                        {formatCurrency(h.currentValue, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                        {h.portfolioShare.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
    </motion.div>
  );
};
