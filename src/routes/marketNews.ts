import { Router } from 'express';
import { getInvestmentsForUser } from '../db/queries.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import { getGeminiClient } from '../services/gemini.ts';

export interface MarketNewsItemPayload {
  headline: string;
  relatedSymbols: string[];
  sentiment: 'Positive' | 'Neutral' | 'Watch';
  summary: string;
  publishedContext?: string;
}

export interface MarketNewsSourcePayload {
  title: string;
  url: string;
  domain: string;
}

export interface MarketNewsResponsePayload {
  items: MarketNewsItemPayload[];
  sources: MarketNewsSourcePayload[];
  searchQueries: string[];
  focus: string;
  portfolioSymbols: string[];
  generatedAt: string;
  fallbackText?: string;
}

interface CacheEntry {
  expiresAt: number;
  payload: MarketNewsResponsePayload;
}

const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
const newsCache = new Map<string, CacheEntry>();

function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'web';
  }
}

function normalizeSentiment(raw?: string): 'Positive' | 'Neutral' | 'Watch' {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('positive') || lower.includes('bullish') || lower.includes('up')) {
    return 'Positive';
  }
  if (
    lower.includes('watch') ||
    lower.includes('risk') ||
    lower.includes('caution') ||
    lower.includes('negative') ||
    lower.includes('bearish')
  ) {
    return 'Watch';
  }
  return 'Neutral';
}

function parseGroundedNewsItems(
  rawText: string,
  knownSymbols: string[]
): MarketNewsItemPayload[] {
  const cleaned = rawText.trim();
  if (!cleaned) return [];

  // Attempt JSON extraction if the model returned a fenced JSON block or array
  const jsonMatch =
    cleaned.match(/```json\s*([\s\S]*?)```/i) ||
    cleaned.match(/(\[\s*\{[\s\S]*\}\s*\])/);
  if (jsonMatch?.[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(parsed)) {
        const items: MarketNewsItemPayload[] = parsed
          .filter((entry) => entry && typeof entry.headline === 'string')
          .slice(0, 6)
          .map((entry) => ({
            headline: String(entry.headline).trim(),
            relatedSymbols: Array.isArray(entry.relatedSymbols)
              ? entry.relatedSymbols.map((s: unknown) => String(s).trim().toUpperCase()).filter(Boolean)
              : [],
            sentiment: normalizeSentiment(
              typeof entry.sentiment === 'string' ? entry.sentiment : undefined
            ),
            summary: typeof entry.summary === 'string' ? entry.summary.trim() : '',
            publishedContext:
              typeof entry.publishedContext === 'string'
                ? entry.publishedContext.trim()
                : undefined,
          }))
          .filter((item) => item.headline && item.summary);
        if (items.length > 0) {
          return items;
        }
      }
    } catch {
      // Fall through to structured markdown section parsing
    }
  }

  // Parse structured ### Headline sections
  const sections = cleaned.split(/^###\s+/m).map((s) => s.trim()).filter(Boolean);
  const parsedItems: MarketNewsItemPayload[] = [];

  for (const section of sections) {
    const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const headline = lines[0].replace(/^\d+[\.)]\s*/, '').replace(/\*\*/g, '').trim();
    if (!headline || headline.length < 6) continue;

    let relatedSymbols: string[] = [];
    let sentiment: 'Positive' | 'Neutral' | 'Watch' = 'Neutral';
    let publishedContext: string | undefined;
    const summaryLines: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const metaLine = line.replace(/\*\*/g, '');

      if (/^(Related|Assets|Tickers|Impact|Sentiment|Timing|Date):/i.test(metaLine) || metaLine.includes('Impact:') || metaLine.includes('Related:')) {
        const relatedMatch = metaLine.match(/(?:Related|Assets|Tickers):\s*([^|]+)/i);
        if (relatedMatch?.[1]) {
          relatedSymbols = relatedMatch[1]
            .split(/[,/]+/)
            .map((s) => s.trim().toUpperCase())
            .filter((s) => s && s !== 'NONE' && s !== 'GENERAL');
        }
        const impactMatch = metaLine.match(/(?:Impact|Sentiment):\s*([^|]+)/i);
        if (impactMatch?.[1]) {
          sentiment = normalizeSentiment(impactMatch[1]);
        }
        const timingMatch = metaLine.match(/(?:Timing|Date):\s*([^|]+)/i);
        if (timingMatch?.[1]) {
          publishedContext = timingMatch[1].trim();
        }
      } else {
        summaryLines.push(line.replace(/^\*\*Summary:\*\*\s*/i, '').trim());
      }
    }

    const summary = summaryLines.join(' ').trim();
    if (!summary) continue;

    if (relatedSymbols.length === 0 && knownSymbols.length > 0) {
      const upperBlock = `${headline} ${summary}`.toUpperCase();
      relatedSymbols = knownSymbols.filter((sym) =>
        new RegExp(`\\b${sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(upperBlock)
      );
    }

    parsedItems.push({
      headline,
      relatedSymbols: relatedSymbols.slice(0, 4),
      sentiment,
      summary,
      publishedContext,
    });
  }

  return parsedItems.slice(0, 6);
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.code;
      const retryable = status === 429 || status === 503 || status === 500;
      if (!retryable || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw lastError;
}

const router = Router();

router.use('/market-news', requireAuth);

router.get('/market-news', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const focusParam =
      typeof req.query.focus === 'string' && req.query.focus.trim()
        ? req.query.focus.trim().toUpperCase()
        : 'ALL';
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    const rows = await getInvestmentsForUser(req.authUser.id);
    const uniqueHoldings = Array.from(
      new Map(
        rows.map((r) => {
          const cleanSym = (r.symbol || '').trim().toUpperCase();
          const key = cleanSym || r.assetName.trim().toUpperCase();
          return [
            key,
            {
              symbol: cleanSym || r.assetName.trim(),
              assetName: r.assetName,
              category: r.category,
            },
          ];
        })
      ).values()
    );

    const portfolioSymbols = uniqueHoldings.map((h) => h.symbol);
    const activeFocus =
      focusParam !== 'ALL' && portfolioSymbols.includes(focusParam)
        ? focusParam
        : 'ALL';

    const cacheKey = `${req.authUser.id}:${activeFocus}:${portfolioSymbols.join(',')}`;
    if (!forceRefresh) {
      const cached = newsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.payload);
      }
    }

    const targetHoldings =
      activeFocus === 'ALL'
        ? uniqueHoldings.slice(0, 10)
        : uniqueHoldings.filter((h) => h.symbol === activeFocus);

    const todayLabel = new Date().toISOString().slice(0, 10);
    const holdingsSummaryText =
      targetHoldings.length > 0
        ? targetHoldings
            .map((h) => `- ${h.symbol}: ${h.assetName} (${h.category})`)
            .join('\n')
        : 'No individual holdings recorded yet; focus on global equities, major index mutual funds, interest rates, and macro market drivers.';

    const prompt = [
      `Today's date is ${todayLabel}. Search for the latest verified financial news and market developments relevant to this investor's portfolio:`,
      holdingsSummaryText,
      '',
      'Provide 4 to 5 concise, factual market news briefings based strictly on recent search results.',
      'Format EVERY news item using this exact structure:',
      '### [Concise factual headline]',
      '**Related:** [Comma-separated matching ticker symbols or "MARKET"] | **Impact:** [Positive, Neutral, or Watch] | **Timing:** [Short relative or calendar timeframe]',
      '[2 to 3 crisp sentences summarizing the verified financial development and why it matters to this holding or portfolio category. Use plain English without hype.]',
    ].join('\n');

    const ai = getGeminiClient();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a senior financial market analyst preparing a grounded daily briefing for an individual investor. Rely strictly on live Google Search results. Never invent prices, earnings numbers, or dates not found in search results.',
          tools: [{ googleSearch: {} }],
        },
      })
    );

    const rawText = response.text ?? '';
    const items = parseGroundedNewsItems(rawText, portfolioSymbols);

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const rawChunks = groundingMetadata?.groundingChunks ?? [];

    const sourceMap = new Map<string, MarketNewsSourcePayload>();
    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      if (!uri || typeof uri !== 'string') continue;
      if (!sourceMap.has(uri)) {
        sourceMap.set(uri, {
          title:
            typeof chunk.web?.title === 'string' && chunk.web.title.trim()
              ? chunk.web.title.trim()
              : extractDomain(uri),
          url: uri,
          domain: extractDomain(uri),
        });
      }
    }

    const searchQueries = Array.isArray(groundingMetadata?.webSearchQueries)
      ? groundingMetadata.webSearchQueries.filter(
          (q): q is string => typeof q === 'string' && q.trim().length > 0
        )
      : [];

    const payload: MarketNewsResponsePayload = {
      items,
      sources: Array.from(sourceMap.values()).slice(0, 8),
      searchQueries: searchQueries.slice(0, 5),
      focus: activeFocus,
      portfolioSymbols,
      generatedAt: new Date().toISOString(),
      fallbackText: items.length === 0 ? rawText.trim() : undefined,
    };

    newsCache.set(cacheKey, {
      expiresAt: Date.now() + NEWS_CACHE_TTL_MS,
      payload,
    });

    return res.json(payload);
  } catch (error: any) {
    console.error('Market news grounding error:', error);
    const message = error?.message || 'Unable to fetch grounded market news.';
    const status = message.includes('GEMINI_API_KEY is not configured')
      ? 503
      : typeof error?.status === 'number' && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
    return res.status(status).json({ error: message });
  }
});

export default router;
