import { AlertCircle, CheckCircle2, FolderOpen } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Link } from 'react-router-dom';

export const AlertBanner: React.FC<{
  type: 'success' | 'error';
  message: string;
  onDismiss?: () => void;
}> = ({ type, message, onDismiss }) => {
  const isSuccess = type === 'success';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      role={isSuccess ? 'status' : 'alert'}
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
        )}
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium underline hover:no-underline shrink-0"
        >
          Dismiss
        </button>
      )}
    </motion.div>
  );
};

export const EmptyPortfolioState: React.FC<{
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}> = ({
  title = 'No investments recorded yet',
  description = 'Add your first stock, mutual fund, or alternative holding to calculate valuation, profit and loss, and portfolio allocation.',
  actionLabel = 'Add First Investment',
  actionTo = '/investments/add',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-slate-200 rounded-xl p-10 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0B1F3A] flex items-center justify-center mx-auto mb-4">
        <FolderOpen className="w-6 h-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-[#0B1F3A]">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed">
        {description}
      </p>
      <div className="mt-5">
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors"
        >
          {actionLabel}
        </Link>
      </div>
    </motion.div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-white border border-slate-200 rounded-xl p-5"
          >
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="h-72 bg-white border border-slate-200 rounded-xl p-6">
        <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="h-9 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};
