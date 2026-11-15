import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback } from 'react';
import {
  formatCurrency,
  formatPercent,
  PortfolioSummary,
} from '../utils/calculations';
import { AnimatedNumber } from './MotionPrimitives';

interface SummaryCardsProps {
  summary: PortfolioSummary;
  currency?: string;
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  currency = 'USD',
}) => {
  const isPositive = summary.netGainLoss >= 0;

  const fmtCurrency = useCallback(
    (v: number) => formatCurrency(v, currency),
    [currency]
  );
  const fmtPositive = useCallback(
    (v: number) => (v > 0 ? `+${formatCurrency(v, currency)}` : formatCurrency(0, currency)),
    [currency]
  );
  const fmtNegative = useCallback(
    (v: number) => (v > 0 ? `-${formatCurrency(v, currency)}` : formatCurrency(0, currency)),
    [currency]
  );
  const fmtPct = useCallback((v: number) => formatPercent(v), []);

  const cards = [
    {
      label: 'Total Investment',
      numericValue: summary.totalInvestment,
      formatter: fmtCurrency,
      sub: `Cost basis across ${summary.holdingsCount} ${
        summary.holdingsCount === 1 ? 'holding' : 'holdings'
      }`,
      valueColor: 'text-[#0B1F3A]',
      icon: <Wallet className="w-4 h-4 text-[#0B1F3A]" />,
    },
    {
      label: 'Current Portfolio Value',
      numericValue: summary.currentPortfolioValue,
      formatter: fmtCurrency,
      sub: 'Market valuation at current prices',
      valueColor: 'text-[#0B1F3A]',
      icon: <DollarSign className="w-4 h-4 text-[#0B1F3A]" />,
    },
    {
      label: 'Total Profit',
      numericValue: summary.profit,
      formatter: fmtPositive,
      sub:
        summary.grossProfit > 0
          ? `Winning positions: +${formatCurrency(summary.grossProfit, currency)}`
          : 'No unrealized gain yet',
      valueColor: summary.profit > 0 ? 'text-emerald-700' : 'text-slate-700',
      icon: (
        <ArrowUpRight
          className={`w-4 h-4 ${
            summary.profit > 0 ? 'text-emerald-700' : 'text-slate-400'
          }`}
        />
      ),
    },
    {
      label: 'Total Loss',
      numericValue: summary.loss,
      formatter: fmtNegative,
      sub:
        summary.grossLoss > 0
          ? `Drawdown positions: -${formatCurrency(summary.grossLoss, currency)}`
          : 'No net portfolio loss',
      valueColor: summary.loss > 0 ? 'text-red-600' : 'text-slate-700',
      icon: (
        <ArrowDownRight
          className={`w-4 h-4 ${summary.loss > 0 ? 'text-red-600' : 'text-slate-400'}`}
        />
      ),
    },
    {
      label: 'Return Percentage',
      numericValue: summary.returnPercentage,
      formatter: fmtPct,
      sub:
        summary.totalInvestment === 0
          ? 'Add holdings to track return'
          : isPositive
            ? 'Positive return on cost'
            : 'Negative return on cost',
      valueColor:
        summary.returnPercentage > 0
          ? 'text-emerald-700'
          : summary.returnPercentage < 0
            ? 'text-red-600'
            : 'text-slate-700',
      icon: (
        <Percent
          className={`w-4 h-4 ${
            summary.returnPercentage > 0
              ? 'text-emerald-700'
              : summary.returnPercentage < 0
                ? 'text-red-600'
                : 'text-slate-400'
          }`}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -3, transition: { duration: 0.16, ease: EASE_OUT } }}
          transition={{ duration: 0.28, delay: idx * 0.05, ease: EASE_OUT }}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{card.label}</span>
            {card.icon}
          </div>
          <p className={`font-mono-num text-xl sm:text-2xl font-semibold ${card.valueColor}`}>
            <AnimatedNumber value={card.numericValue} formatter={card.formatter} />
          </p>
          <p className="text-xs text-slate-500 mt-1.5">{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
};
