import { motion } from 'motion/react';
import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { AlertBanner } from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, updateUserState } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [riskProfile, setRiskProfile] = useState(user?.riskProfile || 'Balanced');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    setProfileBusy(true);
    try {
      const { user: updated } = await apiClient.updateProfile({
        fullName,
        phone,
        currency,
        riskProfile,
      });
      updateUserState(updated);
      setProfileFeedback({
        type: 'success',
        message: 'Profile preferences saved successfully.',
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: err?.message || 'Unable to update profile.',
      });
    } finally {
      setProfileBusy(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordFeedback({
        type: 'error',
        message: 'New password must be between 8 and 128 characters long.',
      });
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordFeedback({
        type: 'error',
        message: 'New password must include at least one letter and one number.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'New passwords do not match.',
      });
      return;
    }

    setPasswordBusy(true);
    try {
      const res = await apiClient.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordFeedback({ type: 'success', message: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err?.message || 'Unable to update password.',
      });
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <DashboardLayout title="Profile" breadcrumb="Account / Profile Settings">
      <div className="max-w-3xl space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-6 border-b border-slate-200">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0B1F3A]">
                Account Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.email} · Role: {user?.role} · Status: {user?.status}
              </p>
            </div>
          </div>

          {profileFeedback && (
            <div className="mb-5">
              <AlertBanner
                type={profileFeedback.type}
                message={profileFeedback.message}
                onDismiss={() => setProfileFeedback(null)}
              />
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prof-name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-phone"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="prof-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 010-9920"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-currency"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Reporting Currency
                </label>
                <select
                  id="prof-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="prof-risk"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Risk Profile
                </label>
                <select
                  id="prof-risk"
                  value={riskProfile}
                  onChange={(e) => setRiskProfile(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Growth">Growth</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileBusy}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] disabled:opacity-60 transition-colors"
              >
                {profileBusy ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
          <h2 className="font-display text-lg font-semibold text-[#0B1F3A] mb-1">
            Security &amp; Password
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Update or set an account password protected by bcrypt hashing.
          </p>

          {passwordFeedback && (
            <div className="mb-5">
              <AlertBanner
                type={passwordFeedback.type}
                message={passwordFeedback.message}
                onDismiss={() => setPasswordFeedback(null)}
              />
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label
                htmlFor="curr-pass"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Current Password (leave blank if signed up via Google only)
              </label>
              <input
                id="curr-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-pass"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>

              <div>
                <label
                  htmlFor="conf-new-pass"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="conf-new-pass"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordBusy}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] disabled:opacity-60 transition-colors"
              >
                {passwordBusy ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
    </motion.div>
  );
};
