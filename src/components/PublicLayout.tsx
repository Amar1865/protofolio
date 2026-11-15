import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About', end: false },
  { to: '/services', label: 'Services', end: false },
  { to: '/contact', label: 'Contact', end: false },
];

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const primaryDestination = user
    ? user.role === 'admin'
      ? '/admin'
      : '/dashboard'
    : '/login';
  const primaryLabel = user ? 'Open Dashboard' : 'Sign In';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#0B1F3A] whitespace-nowrap shrink-0"
          >
            PortfolioVault
          </Link>

          <nav
            aria-label="Primary Navigation"
            onMouseLeave={() => setHoveredPath(null)}
            className="hidden md:flex items-center gap-2"
          >
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onMouseEnter={() => setHoveredPath(item.to)}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#0B1F3A] font-semibold'
                      : 'text-slate-600 hover:text-[#0B1F3A]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {hoveredPath === item.to && !isActive && (
                      <motion.span
                        layoutId="public-nav-hover-box"
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-slate-100 rounded-lg border border-slate-200/80"
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="public-nav-active-box"
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-emerald-50 border border-emerald-200 rounded-lg"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link
                to={primaryDestination}
                className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors whitespace-nowrap shrink-0"
              >
                {primaryLabel}
              </Link>
            </motion.div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3"
            >
              <div className="flex flex-col space-y-1.5">
                {PUBLIC_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-3.5 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-200 text-[#0B1F3A] font-semibold'
                          : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-[#0B1F3A]'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to={primaryDestination}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53]"
                >
                  {primaryLabel}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#0B1F3A] text-slate-300 border-t border-[#132E53]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <p className="font-display text-base font-bold text-white tracking-tight">
              PortfolioVault
            </p>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              Personal Investment Portfolio Manager for individual investors tracking equities,
              mutual funds, and alternative holdings with transparent valuation math.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3">Platform</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3">Account Access</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Investor Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Create Investor Account
                </Link>
              </li>
              <li>
                <Link
                  to="/login?portal=admin"
                  className="hover:text-white transition-colors"
                >
                  Administrator Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>Personal Investment Portfolio Manager</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
