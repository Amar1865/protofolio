import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { AlertBanner } from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
  const { user, registerInvestor, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [riskProfile, setRiskProfile] = useState('Balanced');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must include at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerInvestor({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        currency,
        riskProfile,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to register investor account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <PublicLayout>
      <section className="max-w-lg mx-auto px-6 py-12 lg:py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-9">
          <div className="mb-6">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5">
              Investor Registration
            </p>
            <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
              Create your investor account
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Set up your personal portfolio workspace. All registrations are provisioned with
              standard investor permissions.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <AlertBanner
                type="error"
                message={error}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="alex@example.com"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="signup-currency"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Reporting Currency
                </label>
                <select
                  id="signup-currency"
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
                  htmlFor="signup-risk"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Risk Profile
                </label>
                <select
                  id="signup-risk"
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

            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password (min. 8 characters)
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Create a strong password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div>
              <label
                htmlFor="signup-confirm"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter your password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || googleLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Creating Account...' : 'Create Investor Account'}</span>
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-500">or register with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || submitting}
            className="w-full py-2.5 px-4 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          <p className="text-sm text-slate-600 text-center mt-6">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#0B1F3A] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </PublicLayout>
    </motion.div>
  );
};
