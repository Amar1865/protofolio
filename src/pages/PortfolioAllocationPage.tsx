import { motion } from 'motion/react';
import React from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  AlertBanner,
  DashboardSkeleton,
  EmptyPortfolioState,
} from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent } from '../utils/calculations';

const CATEGORY_COLORS: Record<string, string> = {
  Stocks: '#0B1F3A',
  'Mutual Funds': '#15803D',
  Others: '#64748B',
};

export const PortfolioAllocationPage: React.FC = () => {
  const { user } = useAuth();
  const { holdings, summary, loading, error } = usePortfolio();
  const currency = user?.currency || 'USD';

  const activeCategories = summary.categoryAllocation.filter(
    (c) => c.currentValue > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
      title="Portfolio Allocation"
      breadcrumb="Analytics / Portfolio Allocation"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-semibold text-[#0B1F3A] mb-1">
                Asset Class Distribution
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                (Category Current Value / Total Current Portfolio Value) × 100
              </p>

              <div className="h-72 w-full">
                {activeCategories.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center px-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Current portfolio market value is {formatCurrency(0, currency)}.
                    Allocation percentages safely default to 0.00%.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeCategories}
                        dataKey="currentValue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={96}
                        paddingAngle={3}
                      >
                        {activeCategories.map((entry) => (
                          <Cell
                            key={entry.category}
                            fill={CATEGORY_COLORS[entry.category] || '#0B1F3A'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val) || 0, currency)}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0B1F3A] mb-1">
                  Category Weight Breakdown
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Current valuation share across Stocks, Mutual Funds, and Others
                </p>

                <div className="space-y-6">
                  {summary.categoryAllocation.map((cat) => {
                    const color = CATEGORY_COLORS[cat.category] || '#0B1F3A';
                    const isPositive = cat.netGainLoss >= 0;
                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-semibold text-[#0B1F3A]">
                              {cat.category}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({cat.count} {cat.count === 1 ? 'holding' : 'holdings'})
                            </span>
                          </div>
                          <div className="flex items-center gap-4 font-mono-num">
                            <span className="text-slate-600">
                              {formatCurrency(cat.currentValue, currency)}
                            </span>
                            <span className="font-semibold text-[#0B1F3A] w-16 text-right">
                              {cat.allocationPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: Math.min(1, cat.allocationPercentage / 100),
                            }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full w-full origin-left rounded-full"
                            style={{
                              backgroundColor: color,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Cost Basis: {formatCurrency(cat.investedValue, currency)}
                          </span>
                          <span
                            className={`font-mono-num font-medium ${
                              isPositive ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            Return: {formatPercent(cat.returnPercentage)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Portfolio Market Value</span>
                <span className="font-mono-num text-sm font-semibold text-[#0B1F3A]">
                  {formatCurrency(summary.currentPortfolioValue, currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                Category Valuation Summary
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Holdings</th>
                    <th className="py-3 px-4 text-right">Total Investment</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">Net P&amp;L</th>
                    <th className="py-3 px-4 text-right">Return %</th>
                    <th className="py-3 px-4 text-right">Allocation %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {summary.categoryAllocation.map((cat) => {
                    const isGain = cat.netGainLoss >= 0;
                    return (
                      <tr key={cat.category} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-[#0B1F3A]">
                          {cat.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num">
                          {cat.count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num">
                          {formatCurrency(cat.investedValue, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-medium text-[#0B1F3A]">
                          {formatCurrency(cat.currentValue, currency)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono-num font-medium ${
                            isGain ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {isGain ? '+' : '-'}
                          {formatCurrency(Math.abs(cat.netGainLoss), currency)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono-num font-semibold ${
                            isGain ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {formatPercent(cat.returnPercentage)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A]">
                          {cat.allocationPercentage.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
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
