import { ArrowRight, BarChart2, FileDown, Layers, Shield } from 'lucide-react';
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

export const ServicesPage: React.FC = () => {
  const services = [
    {
      index: '01.',
      title: 'Multi-Category Holding Management',
      description:
        'Add, edit, search, and remove holdings across Stocks, Mutual Funds, and Others. Track unit quantities, cost basis, current market prices, purchase dates, and brokerage notes.',
      icon: Layers,
    },
    {
      index: '02.',
      title: 'Profit, Loss & Return Analytics',
      description:
        'View asset-level and portfolio-wide unrealized profit, drawdown loss, and return percentages side by side in high-density financial tables and comparison bar charts.',
      icon: BarChart2,
    },
    {
      index: '03.',
      title: 'Portfolio Allocation Modeling',
      description:
        'Monitor category concentration across equities, funds, and custom assets using automated weighting formulas and interactive donut and distribution charts.',
      icon: Shield,
    },
    {
      index: '04.',
      title: 'Downloadable Statements & Reports',
      description:
        'Generate clean CSV valuation statements, category allocation exports, and print-ready executive portfolio reports in a single click.',
      icon: FileDown,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <PublicLayout>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <AnimatedHeadingBox
              kicker="Platform Services"
              title="Every tool required to monitor and report your personal wealth."
              subtitle="Designed for individual investors who need structured record keeping, instant P&L feedback, and clean executive reporting across diverse holdings."
            />
            <div>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors"
              >
                <span>Start Managing Your Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-200">
              <ResilientImage
                src={MEDIA_ASSETS.servicesPortfolioWorkspace}
                alt="Analyst desk with financial ledger and market valuation screens"
                className="w-full h-full object-cover"
                fallbackTitle="Portfolio Analytics Workspace"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <InteractivePanel
                key={svc.index}
                delay={idx * 0.05}
                className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono-num text-sm font-semibold text-emerald-700">
                      {svc.index}
                    </span>
                    <Icon className="w-5 h-5 text-[#0B1F3A]" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-[#0B1F3A]">
                    {svc.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    {svc.description}
                  </p>
                </div>
              </InteractivePanel>
            );
          })}
        </div>
      </section>
      </PublicLayout>
    </motion.div>
  );
};
