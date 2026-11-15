import { Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout';
import { AlertBanner } from '../components/StatusFeedback';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, loginWithCredentials, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialPortal = searchParams.get('portal') === 'admin' ? 'admin' : 'investor';
  const [portal, setPortal] = useState<'investor' | 'admin'>(initialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedIn = await loginWithCredentials(email.trim(), password, portal);
      navigate(loggedIn.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in with those credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const loggedIn = await loginWithGoogle();
      navigate(loggedIn.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In did not complete.');
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
        <section className="max-w-lg mx-auto px-6 py-14 lg:py-20">
          <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-9">
          <div className="mb-6">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5">
              Account Authentication
            </p>
            <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
              {portal === 'admin' ? 'Administrator Sign In' : 'Investor Sign In'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {portal === 'admin'
                ? 'Authorized administrator access to user governance and system activity.'
                : 'Sign in to access your investment holdings, valuation analytics, and reports.'}
            </p>
          </div>

          {/* Portal Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setPortal('investor');
                setError(null);
              }}
              className={`relative py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                portal === 'investor'
                  ? 'text-[#0B1F3A]'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              {portal === 'investor' && (
                <motion.span
                  layoutId="login-portal-tab"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-md shadow-sm"
                />
              )}
              <span className="relative z-10">Investor Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPortal('admin');
                setError(null);
              }}
              className={`relative py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                portal === 'admin'
                  ? 'text-[#0B1F3A]'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              {portal === 'admin' && (
                <motion.span
                  layoutId="login-portal-tab"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white rounded-md shadow-sm"
                />
              )}
              <span className="relative z-10">Admin Login</span>
            </button>
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
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={
                  portal === 'admin'
                    ? 'admin@meridianwealth.io'
                    : 'investor@example.com'
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || googleLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {submitting
                  ? 'Authenticating...'
                  : portal === 'admin'
                    ? 'Sign In as Administrator'
                    : 'Sign In to Portfolio'}
              </span>
            </button>
          </form>

          {portal === 'investor' ? (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
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
                <span>
                  {googleLoading ? 'Connecting Google...' : 'Sign in with Google'}
                </span>
              </button>

              <p className="text-sm text-slate-600 text-center mt-6">
                New investor?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-[#0B1F3A] hover:underline"
                >
                  Create an investor account
                </Link>
              </p>
            </>
          ) : (
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
              <span>
                Administrator accounts are provisioned strictly on the server and cannot be
                created via public registration.
              </span>
            </div>
          )}
          </div>
        </section>
      </PublicLayout>
    </motion.div>
  );
};
