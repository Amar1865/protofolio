import { Loader2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { InvestmentPayload } from '../services/api';
import {
  calculateHoldingMetrics,
  formatCurrency,
  formatPercent,
  INVESTMENT_CATEGORIES,
  InvestmentCategory,
} from '../utils/calculations';

interface InvestmentFormProps {
  initialValues?: Partial<InvestmentPayload>;
  currency?: string;
  submitLabel: string;
  onSubmit: (payload: InvestmentPayload) => Promise<void>;
  onCancel?: () => void;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({
  initialValues,
  currency = 'USD',
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const [category, setCategory] = useState<InvestmentCategory>(
    initialValues?.category || 'Stocks'
  );
  const [assetName, setAssetName] = useState(initialValues?.assetName || '');
  const [symbol, setSymbol] = useState(initialValues?.symbol || '');
  const [units, setUnits] = useState(
    initialValues?.units !== undefined ? String(initialValues.units) : ''
  );
  const [purchasePrice, setPurchasePrice] = useState(
    initialValues?.purchasePrice !== undefined
      ? String(initialValues.purchasePrice)
      : ''
  );
  const [currentPrice, setCurrentPrice] = useState(
    initialValues?.currentPrice !== undefined
      ? String(initialValues.currentPrice)
      : ''
  );
  const [purchaseDate, setPurchaseDate] = useState(
    initialValues?.purchaseDate || today
  );
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const liveMetrics = useMemo(() => {
    const u = Number(units);
    const p = Number(purchasePrice);
    const c = Number(currentPrice);
    if (!Number.isFinite(u) || u <= 0 || !Number.isFinite(p) || p <= 0 || !Number.isFinite(c) || c < 0) {
      return null;
    }
    return calculateHoldingMetrics(u, p, c);
  }, [units, purchasePrice, currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (assetName.trim().length < 2) {
      setError('Asset name must be at least 2 characters.');
      return;
    }
    if (symbol.trim().length > 20) {
      setError('Stock symbol must be 20 characters or fewer.');
      return;
    }
    const parsedUnits = Number(units);
    const parsedPurchase = Number(purchasePrice);
    const parsedCurrent = Number(currentPrice);

    if (!Number.isFinite(parsedUnits) || parsedUnits <= 0) {
      setError('Number of units must be greater than zero.');
      return;
    }
    if (!Number.isFinite(parsedPurchase) || parsedPurchase <= 0) {
      setError('Purchase price must be greater than zero.');
      return;
    }
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      setError('Current price must be zero or greater.');
      return;
    }
    if (!purchaseDate) {
      setError('Purchase date is required.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        category,
        assetName: assetName.trim(),
        symbol: symbol.trim().toUpperCase(),
        units: parsedUnits,
        purchasePrice: parsedPurchase,
        currentPrice: parsedCurrent,
        purchaseDate,
        notes: notes.trim(),
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to save investment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="inv-category"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Investment Category
          </label>
          <select
            id="inv-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as InvestmentCategory)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          >
            {INVESTMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="inv-date"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Purchase Date
          </label>
          <input
            id="inv-date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg font-mono-num focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        <div>
          <label
            htmlFor="inv-name"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Asset Name
          </label>
          <input
            id="inv-name"
            type="text"
            placeholder="e.g. Microsoft Corporation"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        <div>
          <label
            htmlFor="inv-symbol"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Stock Symbol (Optional)
          </label>
          <input
            id="inv-symbol"
            type="text"
            placeholder="e.g. MSFT (optional for funds/others)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            maxLength={20}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        <div>
          <label
            htmlFor="inv-units"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Number of Units
          </label>
          <input
            id="inv-units"
            type="number"
            step="any"
            min="0.0001"
            placeholder="e.g. 25"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg font-mono-num focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        <div>
          <label
            htmlFor="inv-purchase-price"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Purchase Price per Unit ({currency})
          </label>
          <input
            id="inv-purchase-price"
            type="number"
            step="any"
            min="0.01"
            placeholder="e.g. 340.50"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg font-mono-num focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        <div>
          <label
            htmlFor="inv-current-price"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Current Price per Unit ({currency})
          </label>
          <input
            id="inv-current-price"
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 412.00"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg font-mono-num focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        <div>
          <label
            htmlFor="inv-notes"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Notes (Optional)
          </label>
          <input
            id="inv-notes"
            type="text"
            placeholder="Brokerage account or thesis"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>
      </div>

      {/* Live Valuation Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">
          Calculated Position Preview
        </p>
        {liveMetrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">Investment Value</p>
              <p className="font-mono-num text-base font-semibold text-[#0B1F3A] mt-0.5">
                {formatCurrency(liveMetrics.investmentValue, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Value</p>
              <p className="font-mono-num text-base font-semibold text-[#0B1F3A] mt-0.5">
                {formatCurrency(liveMetrics.currentValue, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {liveMetrics.netGainLoss >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p
                className={`font-mono-num text-base font-semibold mt-0.5 ${
                  liveMetrics.netGainLoss >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {liveMetrics.netGainLoss >= 0 ? '+' : '-'}
                {formatCurrency(
                  liveMetrics.netGainLoss >= 0 ? liveMetrics.profit : liveMetrics.loss,
                  currency
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Return Percentage</p>
              <p
                className={`font-mono-num text-base font-semibold mt-0.5 ${
                  liveMetrics.returnPercentage >= 0
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                {formatPercent(liveMetrics.returnPercentage)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Enter units, purchase price, and current price to preview position valuation.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitting ? 'Saving...' : submitLabel}</span>
        </button>
      </div>
    </form>
  );
};
