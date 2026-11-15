import { ArrowRight, BarChart3, FileSpreadsheet, PieChart, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { MEDIA_ASSETS } from '../assets/media';
import { InteractiveReturnCalculator } from '../components/InteractiveReturnCalculator';
import {
  FadeSlideIn,
  InteractivePanel,
  ScrollReveal,
} from '../components/MotionPrimitives';
import { PublicLayout } from '../components/PublicLayout';
import { ResilientImage } from '../components/ResilientImage';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const ctaTo = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/signup';
  const ctaText = user ? 'Go to Workspace' : 'Create Investor Account';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <PublicLayout>
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <FadeSlideIn className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-4 hover:border-emerald-300/80 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Personal Wealth Ledger</span>
                  <span aria-hidden="true">·</span>
                  <span>Stocks, Mutual Funds &amp; Alternatives</span>
                </div>

                <h1
                  className="font-display font-bold tracking-tight text-[#0B1F3A] leading-[1.12]"
                  style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.25rem)' }}
                >
                  Precision clarity for every holding in your portfolio.
                </h1>

                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Track stocks, mutual funds, and alternative assets in one structured workspace.
                  Automatically compute cost basis, market valuation, realized and unrealized
                  profit or loss, percentage return, and category-level allocation.
                </p>
              </motion.div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  to={ctaTo}
                  className="group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors whitespace-nowrap"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center px-5 py-3 text-sm font-semibold text-[#0B1F3A] bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Explore Capabilities
                </Link>
              </div>
            </FadeSlideIn>

            <motion.div
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 bg-[#0B1F3A]">
                <ResilientImage
                  src={MEDIA_ASSETS.heroWealthArchitecture}
                  alt="Modern financial wealth management architectural atrium"
                  className="w-full h-full object-cover"
                  fallbackTitle="Personal Investment Portfolio Manager"
                />
              </div>
            </motion.div>
          </div>

          {/* 4-column Core Capability Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-10 border-t border-slate-200">
            {[
              {
                idx: '01. Multi-Asset Tracking',
                title: 'Stocks, Mutual Funds & Others',
                body: 'Record units, purchase cost, current price, and acquisition dates in PostgreSQL.',
              },
              {
                idx: '02. Exact Valuation Math',
                title: 'Automated P&L and ROI',
                body: 'Real-time computation of net gain, drawdown, and return percentage per asset.',
              },
              {
                idx: '03. Allocation Analytics',
                title: 'Category Exposure Charts',
                body: 'Visualize how capital is distributed across equity, fund, and custom categories.',
              },
              {
                idx: '04. Portable Statements',
                title: 'CSV & Printable Reports',
                body: 'Export structured portfolio valuation ledgers and category breakdowns on demand.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3, transition: { duration: 0.16 } }}
                transition={{ duration: 0.28, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-1.5 hover:border-emerald-300/80 transition-colors"
              >
                <p className="text-xs font-medium text-emerald-700">{item.idx}</p>
                <p className="font-display text-base font-semibold text-[#0B1F3A]">
                  {item.title}
                </p>
                <p className="text-sm text-slate-600">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mechanism + Interactive Return Simulator Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 space-y-10">
        <ScrollReveal className="max-w-2xl">
          <p className="text-xs font-semibold text-emerald-700 mb-2">
            Structured Portfolio Architecture
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            Built for transparent financial decision-making
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Every holding calculation follows auditable accounting formulas, isolated to your
            authenticated investor workspace.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <InteractiveReturnCalculator />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InteractivePanel className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#0B1F3A] mb-3">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-display text-lg font-semibold">
                  Unified Valuation &amp; Return Engine
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Monitor total invested capital against live portfolio market value. Identify top
                performing holdings, isolate underperforming positions, and review percentage
                return across your entire asset ledger.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Investment Formula</p>
                <p className="font-mono-num text-xs font-semibold text-[#0B1F3A] mt-1">
                  Sum(Units × Purchase Price)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Current Value Formula</p>
                <p className="font-mono-num text-xs font-semibold text-[#0B1F3A] mt-1">
                  Sum(Units × Current Price)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Return Formula</p>
                <p className="font-mono-num text-xs font-semibold text-emerald-700 mt-1">
                  ((Current - Cost) / Cost) × 100
                </p>
              </div>
            </div>
          </InteractivePanel>

          <InteractivePanel
            delay={0.05}
            className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-[#0B1F3A] mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-display text-lg font-semibold">
                  Isolated User Security
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Passwords are protected with bcrypt hashing, API sessions use signed JWT and
                verified identity tokens, and database queries strictly scope every record to its
                owner.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Role-Based Access Control</span>
              <Link to="/about" className="font-semibold text-[#0B1F3A] hover:underline">
                Learn more
              </Link>
            </div>
          </InteractivePanel>

          <InteractivePanel
            delay={0.08}
            className="bg-white border border-slate-200 rounded-xl p-7"
          >
            <div className="flex items-center gap-2 text-[#0B1F3A] mb-3">
              <PieChart className="w-5 h-5 text-emerald-700" />
              <h3 className="font-display text-lg font-semibold">
                Category-Wise Allocation
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Measure portfolio weight across Stocks, Mutual Funds, and Others with interactive
              allocation charts to keep diversification targets aligned.
            </p>
          </InteractivePanel>

          <InteractivePanel
            delay={0.1}
            className="md:col-span-2 bg-[#0B1F3A] text-white rounded-xl p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-xs font-semibold">Executive Reporting</span>
              </div>
              <h3 className="font-display text-xl font-semibold">
                Ready to centralize your investment records?
              </h3>
              <p className="text-sm text-slate-300 max-w-lg">
                Create an investor account to start logging holdings, inspecting profit and loss,
                and exporting portfolio reports.
              </p>
            </div>
            <Link
              to={ctaTo}
              className="px-5 py-3 text-sm font-semibold text-[#0B1F3A] bg-white rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 text-center"
            >
              {user ? 'Open Dashboard' : 'Get Started'}
            </Link>
          </InteractivePanel>
        </div>
      </section>
      </PublicLayout>
    </motion.div>
  );
};
