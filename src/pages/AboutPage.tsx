import { CheckCircle2, Lock, Scale, Server } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { MEDIA_ASSETS } from '../assets/media';
import {
  AnimatedHeadingBox,
  InteractivePanel,
} from '../components/MotionPrimitives';
import { PublicLayout } from '../components/PublicLayout';
import { ResilientImage } from '../components/ResilientImage';

export const AboutPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <PublicLayout>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-18 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <AnimatedHeadingBox
              kicker="About PortfolioVault"
              title="Built on auditable math, strict data isolation, and calm clarity."
              subtitle="Personal Investment Portfolio Manager gives individual investors an institutional ledger without spreadsheet fragility. Every holding you record is stored in a relational PostgreSQL database and evaluated with deterministic financial formulas."
            />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-mono-num text-xl font-bold text-[#0B1F3A]">3</p>
                <p className="text-xs text-slate-600 mt-1">
                  Core asset classes: Stocks, Mutual Funds, Others
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-mono-num text-xl font-bold text-emerald-700">100%</p>
                <p className="text-xs text-slate-600 mt-1">
                  Owner-scoped SQL queries per investor account
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200">
              <ResilientImage
                src={MEDIA_ASSETS.aboutInstitutionalHall}
                alt="Institutional private wealth client lounge"
                className="w-full h-full object-cover"
                fallbackTitle="Institutional Wealth Architecture"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InteractivePanel className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <Scale className="w-5 h-5 text-emerald-700" />
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A]">
              Deterministic Formulas
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Total investment, current valuation, profit, loss, return percentage, and
              category allocation weights are computed uniformly across backend APIs and live
              UI previews.
            </p>
          </InteractivePanel>

          <InteractivePanel
            delay={0.05}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
          >
            <Lock className="w-5 h-5 text-emerald-700" />
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A]">
              Security by Design
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Investor credentials are hashed with bcrypt, session requests verify signed
              tokens on every API call, and administrator endpoints remain strictly role-gated.
            </p>
          </InteractivePanel>

          <InteractivePanel
            delay={0.1}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
          >
            <Server className="w-5 h-5 text-emerald-700" />
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A]">
              PostgreSQL Persistence
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your portfolio ledger, user profile preferences, and system activity audit trail
              are persisted durably in relational PostgreSQL tables—never transient browser
              storage.
            </p>
          </InteractivePanel>
        </div>

        <div className="mt-10 bg-white border border-slate-200 rounded-xl p-8">
          <h2 className="font-display text-xl font-bold text-[#0B1F3A] mb-5">
            Valuation &amp; Allocation Methodology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              'Total Investment = Sum of (Units × Purchase Price)',
              'Current Portfolio Value = Sum of (Units × Current Price)',
              'Profit = Current Value - Investment Value (when positive)',
              'Loss = Investment Value - Current Value (when positive)',
              'Return Percentage = ((Current Value - Investment Value) / Investment Value) × 100',
              'Portfolio Allocation = (Category Current Value / Total Current Portfolio Value) × 100',
            ].map((formula) => (
              <div
                key={formula}
                className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-mono-num text-xs sm:text-sm text-[#0B1F3A]">
                  {formula}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors"
            >
              Open Investor Account
            </Link>
          </div>
        </div>
      </section>
      </PublicLayout>
    </motion.div>
  );
};
