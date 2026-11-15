import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { InvestmentForm } from '../components/InvestmentForm';
import {
  AlertBanner,
  DashboardSkeleton,
  EmptyPortfolioState,
} from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { apiClient, InvestmentPayload } from '../services/api';
import {
  ComputedInvestment,
  formatCurrency,
  formatPercent,
  INVESTMENT_CATEGORIES,
} from '../utils/calculations';

export const ManageInvestmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { holdings, summary, loading, error, reload } = usePortfolio();
  const currency = user?.currency || 'USD';

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ComputedInvestment | null>(null);
  const [deletingItem, setDeletingItem] = useState<ComputedInvestment | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredHoldings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return holdings.filter((item) => {
      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;
      const matchesSearch =
        !q ||
        item.assetName.toLowerCase().includes(q) ||
        item.symbol.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [holdings, categoryFilter, searchQuery]);

  const handleUpdate = async (payload: InvestmentPayload) => {
    if (!editingItem) return;
    await apiClient.updateInvestment(editingItem.id, payload);
    setEditingItem(null);
    const label = payload.symbol
      ? `${payload.assetName} (${payload.symbol})`
      : payload.assetName;
    setFeedback({
      type: 'success',
      message: `Updated ${label}.`,
    });
    await reload();
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeletingBusy(true);
    try {
      await apiClient.deleteInvestment(deletingItem.id);
      const label = deletingItem.symbol
        ? `${deletingItem.assetName} (${deletingItem.symbol})`
        : deletingItem.assetName;
      setFeedback({
        type: 'success',
        message: `Removed ${label}.`,
      });
      setDeletingItem(null);
      await reload();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to delete investment.',
      });
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
      title="Manage Investments"
      breadcrumb="Investments / Holdings Ledger"
      actions={
        <Link
          to="/investments/add"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Investment</span>
        </Link>
      }
    >
      <div className="space-y-5">
        {feedback && (
          <AlertBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}
        {error && <AlertBanner type="error" message={error} />}

        {loading ? (
          <DashboardSkeleton />
        ) : holdings.length === 0 ? (
          <EmptyPortfolioState />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start overflow-x-auto max-w-full">
                {['All', ...INVESTMENT_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === cat
                        ? 'text-[#0B1F3A]'
                        : 'text-slate-600 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {categoryFilter === cat && (
                      <motion.span
                        layoutId="manage-cat-tab"
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by symbol or name..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>
            </div>

            {filteredHoldings.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No holdings match your current filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Asset &amp; Symbol</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Purchased</th>
                      <th className="py-3 px-4 text-right">Units</th>
                      <th className="py-3 px-4 text-right">Buy Price</th>
                      <th className="py-3 px-4 text-right">Current Price</th>
                      <th className="py-3 px-4 text-right">Invested</th>
                      <th className="py-3 px-4 text-right">Current Value</th>
                      <th className="py-3 px-4 text-right">P&amp;L / Return</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredHoldings.map((item) => {
                      const isGain = item.netGainLoss >= 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#0B1F3A]">
                              {item.symbol || item.assetName}
                            </p>
                            {item.symbol && (
                              <p className="text-xs text-slate-500 max-w-[180px] truncate">
                                {item.assetName}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-3 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                            {item.purchaseDate}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                            {item.units.toLocaleString('en-US', {
                              maximumFractionDigits: 4,
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-slate-600">
                            {formatCurrency(item.purchasePrice, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-slate-900">
                            {formatCurrency(item.currentPrice, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                            {formatCurrency(item.investmentValue, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#0B1F3A]">
                            {formatCurrency(item.currentValue, currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num whitespace-nowrap">
                            <p
                              className={`font-semibold ${
                                isGain ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {isGain ? 'Profit ' : 'Loss '}
                              {formatCurrency(
                                isGain ? item.profit : item.loss,
                                currency
                              )}
                            </p>
                            <p
                              className={`text-xs ${
                                isGain ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {formatPercent(item.returnPercentage)}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-2 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 transition-colors"
                                aria-label={`Edit ${item.symbol || item.assetName}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                aria-label={`Delete ${item.symbol || item.assetName}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 text-xs font-semibold text-[#0B1F3A]">
                      <td colSpan={6} className="py-3 px-4">
                        Portfolio Totals ({summary.holdingsCount} holdings)
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        {formatCurrency(summary.totalInvestment, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        {formatCurrency(summary.currentPortfolioValue, currency)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-num ${
                          summary.netGainLoss >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(summary.returnPercentage)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-holding-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
                <h2
                  id="edit-holding-title"
                  className="font-display text-lg font-bold text-[#0B1F3A]"
                >
                  Edit Investment · {editingItem.symbol || editingItem.assetName}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <InvestmentForm
                initialValues={{
                  category: editingItem.category,
                  assetName: editingItem.assetName,
                  symbol: editingItem.symbol,
                  units: editingItem.units,
                  purchasePrice: editingItem.purchasePrice,
                  currentPrice: editingItem.currentPrice,
                  purchaseDate: editingItem.purchaseDate,
                  notes: editingItem.notes,
                }}
                currency={currency}
                submitLabel="Save Changes"
                onSubmit={handleUpdate}
                onCancel={() => setEditingItem(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-holding-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4"
            >
              <h2
                id="delete-holding-title"
                className="font-display text-lg font-bold text-[#0B1F3A]"
              >
                Delete Holding?
              </h2>
              <p className="text-sm text-slate-600">
                Remove <strong>{deletingItem.assetName}</strong>
                {deletingItem.symbol ? ` (${deletingItem.symbol})` : ''} from your
                portfolio ledger? This permanently deletes the record from your database.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingBusy}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingBusy ? 'Deleting...' : 'Delete Holding'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </DashboardLayout>
    </motion.div>
  );
};
