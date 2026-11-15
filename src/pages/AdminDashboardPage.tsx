import { Activity, Briefcase, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { AnimatedNumber, FadeSlideIn } from '../components/MotionPrimitives';
import { AlertBanner, DashboardSkeleton } from '../components/StatusFeedback';
import { AdminOverviewResponse, apiClient } from '../services/api';
import { formatCurrency } from '../utils/calculations';

export const AdminDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAdminOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load system overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const fmtInt = useCallback((v: number) => String(Math.round(v)), []);
  const fmtActive = useCallback((v: number) => `${Math.round(v)} Active`, []);
  const fmtUsd = useCallback((v: number) => formatCurrency(v, 'USD'), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout
      title="Admin Dashboard"
      breadcrumb="Administration / System Overview"
      actions={
        <Link
          to="/admin/users"
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] whitespace-nowrap"
        >
          Manage Users
        </Link>
      }
    >
      {error && (
        <div className="mb-6">
          <AlertBanner type="error" message={error} />
        </div>
      )}

      {loading || !overview ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* System KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Registered Accounts</span>
                <Users className="w-4 h-4 text-[#0B1F3A]" />
              </div>
              <p className="font-mono-num text-2xl font-semibold text-[#0B1F3A]">
                <AnimatedNumber value={overview.totalUsers} formatter={fmtInt} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {overview.investorCount} investors · {overview.adminCount} administrators
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Account Status</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="font-mono-num text-2xl font-semibold text-emerald-700">
                <AnimatedNumber value={overview.activeUsers} formatter={fmtActive} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {overview.inactiveUsers} deactivated accounts
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Tracked Holdings</span>
                <Briefcase className="w-4 h-4 text-[#0B1F3A]" />
              </div>
              <p className="font-mono-num text-2xl font-semibold text-[#0B1F3A]">
                <AnimatedNumber value={overview.totalHoldings} formatter={fmtInt} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Total active records in PostgreSQL
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Aggregate Market Value</span>
                <Activity className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="font-mono-num text-2xl font-semibold text-[#0B1F3A]">
                <AnimatedNumber
                  value={overview.aggregateCurrentValue}
                  formatter={fmtUsd}
                />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Cost basis: {formatCurrency(overview.aggregateInvested, 'USD')}
              </p>
            </motion.div>
          </div>

          {/* System Activity Log Table */}
          <FadeSlideIn
            delay={0.08}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                  System Activity Monitor
                </h2>
                <p className="text-xs text-slate-500">
                  Recent authentication, portfolio, and user governance events
                </p>
              </div>
              <button
                type="button"
                onClick={loadOverview}
                className="text-xs font-semibold text-[#0B1F3A] hover:underline"
              >
                Refresh Feed
              </button>
            </div>

            {overview.recentLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No system activities recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {overview.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono-num text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0B1F3A] whitespace-nowrap">
                          {log.actorEmail}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FadeSlideIn>

          {/* Contact Inquiries */}
          {overview.recentInquiries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                  Recent Contact Inquiries
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {overview.recentInquiries.map((inq) => (
                  <div key={inq.id} className="p-5 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[#0B1F3A]">
                        {inq.subject}
                      </p>
                      <span className="font-mono-num text-xs text-slate-500">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {inq.name} · {inq.email}
                    </p>
                    <p className="text-sm text-slate-700 pt-1">{inq.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </DashboardLayout>
    </motion.div>
  );
};
