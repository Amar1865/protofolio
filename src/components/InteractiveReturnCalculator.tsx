import { Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import {
  calculateHoldingMetrics,
  formatCurrency,
  formatPercent,
  INVESTMENT_CATEGORIES,
  InvestmentCategory,
} from '../utils/calculations';
import { AnimatedNumber } from './MotionPrimitives';

export const InteractiveReturnCalculator: React.FC = () => {
  const [category, setCategory] = useState<InvestmentCategory>('Stocks');
  const [units, setUnits] = useState<number>(40);
  const [purchasePrice, setPurchasePrice] = useState<number>(145);
  const [currentPrice, setCurrentPrice] = useState<number>(178);

  const metrics = useMemo(
    () => calculateHoldingMetrics(units, purchasePrice, currentPrice),
    [units, purchasePrice, currentPrice]
  );

  const isPositive = metrics.netGainLoss >= 0;
  const fmtUsd = useCallback((v: number) => formatCurrency(v), []);
  const fmtPnl = useCallback(
    (v: number) => `${isPositive ? '+' : '-'}${formatCurrency(v)}`,
    [isPositive]
  );
  const fmtPct = useCallback((v: number) => formatPercent(v), []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-[#0B1F3A]">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <h3 className="font-display text-lg font-semibold">
              Interactive Portfolio Return Simulator
            </h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Adjust category, units, purchase cost, and market price to preview live valuation
            and return math.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          {INVESTMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                category === cat
                  ? 'text-[#0B1F3A]'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              {category === cat && (
                <motion.span
                  layoutId="home-calc-tab"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-md shadow-sm"
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="sim-units" className="font-medium text-slate-700">
              Units Held
            </label>
            <span className="font-mono-num font-semibold text-[#0B1F3A]">
              {units} units
            </span>
          </div>
          <input
            id="sim-units"
            type="range"
            min={1}
            max={250}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full accent-[#0B1F3A] cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="sim-buy" className="font-medium text-slate-700">
              Purchase Price
            </label>
            <span className="font-mono-num font-semibold text-[#0B1F3A]">
              {formatCurrency(purchasePrice)}
            </span>
          </div>
          <input
            id="sim-buy"
            type="range"
            min={10}
            max={500}
            step={5}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            className="w-full accent-[#0B1F3A] cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="sim-curr" className="font-medium text-slate-700">
              Current Market Price
            </label>
            <span className="font-mono-num font-semibold text-[#0B1F3A]">
              {formatCurrency(currentPrice)}
            </span>
          </div>
          <input
            id="sim-curr"
            type="range"
            min={10}
            max={600}
            step={5}
            value={currentPrice}
            onChange={(e) => setCurrentPrice(Number(e.target.value))}
            className="w-full accent-emerald-700 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16 }}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <p className="text-xs text-slate-500">Total Investment ({category})</p>
          <p className="font-mono-num text-lg font-semibold text-[#0B1F3A] mt-1">
            <AnimatedNumber value={metrics.investmentValue} formatter={fmtUsd} />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16 }}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <p className="text-xs text-slate-500">Current Portfolio Value</p>
          <p className="font-mono-num text-lg font-semibold text-[#0B1F3A] mt-1">
            <AnimatedNumber value={metrics.currentValue} formatter={fmtUsd} />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16 }}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <p className="text-xs text-slate-500">
            {isPositive ? 'Calculated Profit' : 'Calculated Loss'}
          </p>
          <p
            className={`font-mono-num text-lg font-semibold mt-1 ${
              isPositive ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            <AnimatedNumber
              value={isPositive ? metrics.profit : metrics.loss}
              formatter={fmtPnl}
            />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16 }}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200"
        >
          <p className="text-xs text-slate-500">Return Percentage</p>
          <p
            className={`font-mono-num text-lg font-semibold mt-1 ${
              isPositive ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            <AnimatedNumber value={metrics.returnPercentage} formatter={fmtPct} />
          </p>
        </motion.div>
      </div>
    </div>
  );
};
