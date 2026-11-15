import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { InvestmentForm } from '../components/InvestmentForm';
import { AlertBanner } from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';
import { apiClient, InvestmentPayload } from '../services/api';

export const AddInvestmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleCreate = async (payload: InvestmentPayload) => {
    await apiClient.createInvestment(payload);
    const label = payload.symbol
      ? `${payload.assetName} (${payload.symbol})`
      : payload.assetName;
    setSuccessMsg(`${label} has been added to your portfolio.`);
    setFormKey((k) => k + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
      title="Add Investment"
      breadcrumb="Investments / New Holding"
      actions={
        <Link
          to="/investments"
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
        >
          View All Investments
        </Link>
      }
    >
      <div className="max-w-3xl space-y-5">
        {successMsg && (
          <AlertBanner
            type="success"
            message={successMsg}
            onDismiss={() => setSuccessMsg(null)}
          />
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A]">
              Record Asset Position
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Enter your asset details below. Purchase cost and current valuation metrics
              are calculated automatically.
            </p>
          </div>

          <InvestmentForm
            key={formKey}
            currency={user?.currency || 'USD'}
            submitLabel="Add Investment"
            onSubmit={handleCreate}
            onCancel={() => navigate('/investments')}
          />
        </div>
      </div>
    </DashboardLayout>
    </motion.div>
  );
};
