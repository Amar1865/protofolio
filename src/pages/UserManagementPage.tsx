import { Search, UserCheck, UserX } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { AlertBanner, DashboardSkeleton } from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';
import { AdminUserItem, apiClient } from '../services/api';
import { formatCurrency } from '../utils/calculations';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users: list } = await apiClient.getAdminUsers();
      setUsers(list);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Unable to load registered users.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [users, searchQuery, statusFilter]);

  const handleToggleStatus = async (target: AdminUserItem) => {
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    setBusyId(target.id);
    setFeedback(null);
    try {
      await apiClient.updateAdminUserStatus(target.id, nextStatus);
      setFeedback({
        type: 'success',
        message: `${target.fullName} (${target.email}) is now ${nextStatus}.`,
      });
      await loadUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update account status.',
      });
    } finally {
      setBusyId(null);
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
      title="User Management"
      breadcrumb="Administration / User Accounts"
    >
      <div className="space-y-5">
        {feedback && (
          <AlertBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                {(['all', 'active', 'inactive'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`relative px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                      statusFilter === st
                        ? 'text-[#0B1F3A]'
                        : 'text-slate-600 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {statusFilter === st && (
                      <motion.span
                        layoutId="admin-user-status-tab"
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{st}</span>
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No accounts match your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Holdings</th>
                      <th className="py-3 px-4 text-right">Portfolio Value</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Account Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredUsers.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      const isActive = u.status === 'active';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#0B1F3A]">
                              {u.fullName}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-700">
                            {u.role}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs font-semibold ${
                                isActive ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num">
                            {u.holdingsCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-[#0B1F3A]">
                            {formatCurrency(u.totalCurrent, u.currency)}
                          </td>
                          <td className="py-3 px-4 font-mono-num text-xs text-slate-500 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isSelf ? (
                              <span className="text-xs text-slate-400">
                                Current Admin
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === u.id}
                                onClick={() => handleToggleStatus(u)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                                  isActive
                                    ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                                    : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      </DashboardLayout>
    </motion.div>
  );
};
