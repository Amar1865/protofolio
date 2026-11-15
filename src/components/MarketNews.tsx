import {
  ArrowUpRight,
  Globe,
  Newspaper,
  RefreshCw,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, MarketNewsResponse } from '../services/api';
import { ComputedInvestment } from '../utils/calculations';
import { FadeSlideIn } from './MotionPrimitives';
import { AlertBanner } from './StatusFeedback';

interface MarketNewsProps {
  holdings: ComputedInvestment[];
}

const SENTIMENT_STYLE: Record<'Positive' | 'Neutral' | 'Watch', string> = {
  Positive: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  Watch: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const MarketNews: React.FC<MarketNewsProps> = ({ holdings }) => {
  const [focus, setFocus] = useState<string>('ALL');
  const [data, setData] = useState<MarketNewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const h of holdings) {
      if (h.symbol) set.add(h.symbol.toUpperCase());
    }
    return Array.from(set).slice(0, 8);
  }, [holdings]);

  const portfolioKey = uniqueSymbols.join(',');

  // Reset focus to ALL if a selected symbol was removed from holdings
  useEffect(() => {
    if (focus !== 'ALL' && !uniqueSymbols.includes(focus)) {
      setFocus('ALL');
    }
  }, [focus, uniqueSymbols]);

  const fetchNews = useCallback(
    async (selectedFocus: string, forceRefresh = false) => {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await apiClient.getMarketNews({
          focus: selectedFocus,
          refresh: forceRefresh,
        });
        setData(res);
      } catch (err: any) {
        setError(err?.message || 'Unable to load search-grounded market news.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchNews(focus, false);
  }, [focus, portfolioKey, fetchNews]);

  const formattedUpdatedAt = useMemo(() => {
    if (!data?.generatedAt) return null;
    const d = new Date(data.generatedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [data?.generatedAt]);

  return (
    <FadeSlideIn
      delay={0.2}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center shrink-0 mt-0.5">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
                Market News
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                <Globe className="w-3 h-3" />
                <span>Search Grounded</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {uniqueSymbols.length > 0
                ? `Latest financial briefings tailored to your portfolio (${uniqueSymbols.slice(0, 5).join(', ')}${uniqueSymbols.length > 5 ? ` +${uniqueSymbols.length - 5}` : ''})`
                : 'Latest market developments for equities, funds, and macro rates'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {formattedUpdatedAt && !loading && (
            <span className="font-mono-num text-xs text-slate-400">
              Updated {formattedUpdatedAt}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchNews(focus, true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh News'}</span>
          </button>
        </div>
      </div>

      {/* Holding Focus Filter */}
      {uniqueSymbols.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0 mr-1">
            Focus:
          </span>
          <button
            type="button"
            onClick={() => setFocus('ALL')}
            className={`relative px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              focus === 'ALL'
                ? 'text-white'
                : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-200/60'
            }`}
          >
            {focus === 'ALL' && (
              <motion.span
                layoutId="market-news-focus-tab"
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-[#0B1F3A] rounded-md"
              />
            )}
            <span className="relative z-10">All Holdings</span>
          </button>
          {uniqueSymbols.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => setFocus(sym)}
              className={`relative px-2.5 py-1 text-xs font-mono-num font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                focus === sym
                  ? 'text-white'
                  : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-200/60'
              }`}
            >
              {focus === sym && (
                <motion.span
                  layoutId="market-news-focus-tab"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-[#0B1F3A] rounded-md"
                />
              )}
              <span className="relative z-10">{sym}</span>
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="p-6">
        {error && (
          <div className="space-y-3">
            <AlertBanner
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
            <button
              type="button"
              onClick={() => fetchNews(focus, true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] transition-colors"
            >
              Retry News Fetch
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((slot) => (
              <div
                key={slot}
                className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                </div>
                <div className="h-4 w-5/6 bg-slate-200 rounded" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-200 rounded" />
                  <div className="h-3 w-4/5 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !error && data ? (
          <div className="space-y-5">
            {data.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.items.map((item, idx) => (
                  <motion.article
                    key={`${item.headline}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2, transition: { duration: 0.16 } }}
                    transition={{
                      duration: 0.24,
                      delay: idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:border-slate-300 hover:bg-white transition-colors flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.relatedSymbols.length > 0 ? (
                            item.relatedSymbols.map((sym) => (
                              <span
                                key={sym}
                                className="font-mono-num px-2 py-0.5 text-[11px] font-semibold bg-[#0B1F3A] text-white rounded"
                              >
                                {sym}
                              </span>
                            ))
                          ) : (
                            <span className="font-mono-num px-2 py-0.5 text-[11px] font-semibold bg-slate-200 text-slate-700 rounded">
                              MARKET
                            </span>
                          )}
                          {item.publishedContext && (
                            <span className="text-[11px] text-slate-500">
                              {item.publishedContext}
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold border rounded ${
                            SENTIMENT_STYLE[item.sentiment]
                          }`}
                        >
                          {item.sentiment}
                        </span>
                      </div>

                      <h3 className="font-display text-sm font-semibold text-[#0B1F3A] leading-snug">
                        {item.headline}
                      </h3>

                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : data.fallbackText ? (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {data.fallbackText}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No recent news briefings were returned for the selected focus.
              </p>
            )}

            {/* Grounded Sources & Search Queries */}
            {(data.sources.length > 0 || data.searchQueries.length > 0) && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                {data.sources.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Verified Grounding Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.sources.map((src) => (
                        <a
                          key={src.url}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#0B1F3A] bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors max-w-[260px]"
                          title={src.title}
                        >
                          <span className="truncate">{src.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({src.domain})
                          </span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {data.searchQueries.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <Search className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Queries:</span>
                    {data.searchQueries.map((q) => (
                      <span
                        key={q}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </FadeSlideIn>
  );
};
