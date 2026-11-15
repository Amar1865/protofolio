import { FileSpreadsheet, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../components/DashboardLayout';
import { MarketNews } from '../components/MarketNews';
import { FadeSlideIn } from '../components/MotionPrimitives';
import {
  AlertBanner,
  DashboardSkeleton,
  EmptyPortfolioState,
} from '../components/StatusFeedback';
import { SummaryCards } from '../components/SummaryCards';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency, formatPercent } from '../utils/calculations';

const ALLOCATION_COLORS: Record<string, string> = {
  Stocks: '#0B1F3A',
  'Mutual Funds': '#15803D',
  Others: '#64748B',
};

export const InvestorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { holdings, summary, loading, error } = usePortfolio();
  const currency = user?.currency || 'USD';
  const [perfView, setPerfView] = useState<'holdings' | 'pnl' | 'category'>('holdings');

  const allocationData = useMemo(
    () => summary.categoryAllocation.filter((c) => c.currentValue > 0),
    [summary.categoryAllocation]
  );

  const holdingsPerformanceData = useMemo(
    () =>
      holdings.slice(0, 8).map((h) => ({
        id: h.id,
        label: h.symbol || h.assetName.slice(0, 12),
        Invested: h.investmentValue,
        'Current Value': h.currentValue,
        netGainLoss: h.netGainLoss,
      })),
    [holdings]
  );

  const categoryBarData = useMemo(
    () =>
      summary.categoryAllocation.map((c) => ({
        label: c.category as string,
        Invested: c.investedValue,
        'Current Value': c.currentValue,
      })),
    [summary.categoryAllocation]
  );

  const comparisonChartData = useMemo(
    () =>
      perfView === 'category'
        ? categoryBarData
        : holdingsPerformanceData.map((h) => ({
            label: h.label,
            Invested: h.Invested,
            'Current Value': h['Current Value'],
          })),
    [perfView, categoryBarData, holdingsPerformanceData]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
        title="Investor Dashboard"
        breadcrumb="Workspace / Overview"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0B1F3A] bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio Reports</span>
              <span className="sm:hidden">Reports</span>
            </Link>
            <Link
              to="/investments/add"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Investment</span>
            </Link>
          </div>
        }
      >
        {error && (
          <div className="mb-6">
            <AlertBanner type="error" message={error} />
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            <SummaryCards summary={summary} currency={currency} />

            {holdings.length === 0 ? (
              <EmptyPortfolioState />
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Investment Performance Chart */}
                  <FadeSlideIn
                    delay={0.08}
                    className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                            Investment Performance Chart
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {perfView === 'holdings'
                              ? 'Cost basis vs. market value across active holdings'
                              : perfView === 'pnl'
                                ? 'Unrealized profit and loss per holding'
                                : 'Invested vs. current value across asset categories'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                          {(
                            [
                              { id: 'holdings', label: 'Holdings' },
                              { id: 'pnl', label: 'Net P&L' },
                              { id: 'category', label: 'Categories' },
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setPerfView(tab.id)}
                              className={`relative px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                                perfView === tab.id
                                  ? 'text-[#0B1F3A]'
                                  : 'text-slate-600 hover:text-[#0B1F3A]'
                              }`}
                            >
                              {perfView === tab.id && (
                                <motion.span
                                  layoutId="dashboard-perf-tab"
                                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                  className="absolute inset-0 bg-white rounded-md shadow-sm"
                                />
                              )}
                              <span className="relative z-10">{tab.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {perfView === 'pnl' ? (
                            <BarChart
                              data={holdingsPerformanceData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: '#475569' }}
                              />
                              <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                              <ReferenceLine y={0} stroke="#0B1F3A" />
                              <Tooltip
                                formatter={(val: any) =>
                                  formatCurrency(Number(val) || 0, currency)
                                }
                                contentStyle={{
                                  borderRadius: '8px',
                                  borderColor: '#E2E8F0',
                                  fontSize: '12px',
                                }}
                              />
                              <Bar dataKey="netGainLoss" name="Net P&L" radius={[4, 4, 0, 0]}>
                                {holdingsPerformanceData.map((entry) => (
                                  <Cell
                                    key={entry.id}
                                    fill={entry.netGainLoss >= 0 ? '#15803D' : '#DC2626'}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          ) : (
                            <BarChart
                              data={comparisonChartData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: '#475569' }}
                              />
                              <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                              <Tooltip
                                formatter={(val: any) =>
                                  formatCurrency(Number(val) || 0, currency)
                                }
                                contentStyle={{
                                  borderRadius: '8px',
                                  borderColor: '#E2E8F0',
                                  fontSize: '12px',
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Bar dataKey="Invested" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                              <Bar
                                dataKey="Current Value"
                                fill="#0B1F3A"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <Link
                        to="/profit-loss"
                        className="font-semibold text-[#0B1F3A] hover:underline"
                      >
                        Profit &amp; Loss Statement
                      </Link>
                      <Link
                        to="/overview"
                        className="font-semibold text-[#0B1F3A] hover:underline"
                      >
                        Full Portfolio Overview
                      </Link>
                    </div>
                  </FadeSlideIn>

                  {/* Portfolio Allocation Pie Chart & Category Breakdown */}
                  <FadeSlideIn
                    delay={0.14}
                    className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                            Portfolio Allocation
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Category breakdown &amp; portfolio weight
                          </p>
                        </div>
                        <Link
                          to="/allocation"
                          className="text-xs font-semibold text-[#0B1F3A] hover:underline whitespace-nowrap"
                        >
                          Details
                        </Link>
                      </div>

                      <div className="h-52 w-full">
                        {allocationData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center px-4 text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Current market valuation is {formatCurrency(0, currency)} across
                            recorded holdings.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={allocationData}
                                dataKey="currentValue"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={78}
                                paddingAngle={3}
                              >
                                {allocationData.map((entry) => (
                                  <Cell
                                    key={entry.category}
                                    fill={ALLOCATION_COLORS[entry.category] || '#0B1F3A'}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val: any) =>
                                  formatCurrency(Number(val) || 0, currency)
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      {summary.categoryAllocation.map((cat) => {
                        const catGain = cat.netGainLoss >= 0;
                        return (
                          <div key={cat.category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                                  style={{
                                    backgroundColor:
                                      ALLOCATION_COLORS[cat.category] || '#0B1F3A',
                                  }}
                                />
                                <span className="font-semibold text-[#0B1F3A] truncate">
                                  {cat.category}
                                </span>
                                <span className="text-slate-400 shrink-0">
                                  ({cat.count})
                                </span>
                              </div>
                              <div className="flex items-center gap-3 font-mono-num shrink-0">
                                <span className="text-slate-600">
                                  {formatCurrency(cat.currentValue, currency)}
                                </span>
                                <span className="font-semibold text-[#0B1F3A] w-14 text-right">
                                  {cat.allocationPercentage.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pl-4.5">
                              <span>
                                Invested: {formatCurrency(cat.investedValue, currency)}
                              </span>
                              <span
                                className={`font-mono-num font-medium ${
                                  cat.investedValue === 0
                                    ? 'text-slate-400'
                                    : catGain
                                      ? 'text-emerald-700'
                                      : 'text-red-600'
                                }`}
                              >
                                {formatPercent(cat.returnPercentage)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </FadeSlideIn>
                </div>

                {/* Recent Investments Table */}
                <FadeSlideIn
                  delay={0.18}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                        Recent Investments
                      </h2>
                      <p className="text-xs text-slate-500">
                        Showing {Math.min(holdings.length, 6)} of {holdings.length}{' '}
                        recorded positions
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        to="/reports"
                        className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap"
                      >
                        Export Reports
                      </Link>
                      <Link
                        to="/investments"
                        className="text-xs font-semibold text-[#0B1F3A] hover:underline whitespace-nowrap"
                      >
                        Manage All
                      </Link>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">Asset</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Units</th>
                          <th className="py-3 px-4 text-right">Invested</th>
                          <th className="py-3 px-4 text-right">Current Value</th>
                          <th className="py-3 px-4 text-right">Profit / Loss</th>
                          <th className="py-3 px-4 text-right">Return</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {holdings.slice(0, 6).map((item, idx) => {
                          const isGain = item.netGainLoss >= 0;
                          return (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: idx * 0.04,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <p className="font-semibold text-[#0B1F3A]">
                                  {item.symbol || item.assetName}
                                </p>
                                {item.symbol && (
                                  <p className="text-xs text-slate-500">
                                    {item.assetName}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.category}
                              </td>
                              <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                                {item.units.toLocaleString('en-US', {
                                  maximumFractionDigits: 4,
                                })}
                              </td>
                              <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                                {formatCurrency(item.investmentValue, currency)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono-num font-medium text-[#0B1F3A]">
                                {formatCurrency(item.currentValue, currency)}
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-mono-num font-medium ${
                                  isGain ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {isGain ? 'Profit ' : 'Loss '}
                                {formatCurrency(
                                  isGain ? item.profit : item.loss,
                                  currency
                                )}
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-mono-num font-semibold ${
                                  isGain ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {formatPercent(item.returnPercentage)}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </FadeSlideIn>
              </>
            )}

            <MarketNews holdings={holdings} />
          </div>
        )}
      </DashboardLayout>
    </motion.div>
  );
};
