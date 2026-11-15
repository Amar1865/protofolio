export type InvestmentCategory = 'Stocks' | 'Mutual Funds' | 'Others';
export type UserRole = 'investor' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface InvestmentRecord {
  id: number;
  userId: number;
  category: InvestmentCategory;
  assetName: string;
  symbol: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComputedInvestment extends InvestmentRecord {
  investmentValue: number;
  currentValue: number;
  netGainLoss: number;
  profit: number;
  loss: number;
  returnPercentage: number;
  portfolioShare: number;
}

export interface CategoryAllocationItem {
  category: InvestmentCategory;
  investedValue: number;
  currentValue: number;
  profit: number;
  loss: number;
  netGainLoss: number;
  returnPercentage: number;
  allocationPercentage: number;
  count: number;
}

export interface PortfolioSummary {
  totalInvestment: number;
  currentPortfolioValue: number;
  netGainLoss: number;
  profit: number;
  loss: number;
  grossProfit: number;
  grossLoss: number;
  returnPercentage: number;
  holdingsCount: number;
  categoryAllocation: CategoryAllocationItem[];
}

export const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  'Stocks',
  'Mutual Funds',
  'Others',
];

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function calculateHoldingMetrics(
  units: number,
  purchasePrice: number,
  currentPrice: number
) {
  const safeUnits = Number.isFinite(units) && units > 0 ? units : 0;
  const safePurchase =
    Number.isFinite(purchasePrice) && purchasePrice > 0 ? purchasePrice : 0;
  const safeCurrent =
    Number.isFinite(currentPrice) && currentPrice >= 0 ? currentPrice : 0;

  const rawInvestmentValue = safeUnits * safePurchase;
  const rawCurrentValue = safeUnits * safeCurrent;
  const rawNetGainLoss = rawCurrentValue - rawInvestmentValue;
  const rawProfit = rawNetGainLoss > 0 ? rawNetGainLoss : 0;
  const rawLoss = rawNetGainLoss < 0 ? rawInvestmentValue - rawCurrentValue : 0;
  const rawReturnPercentage =
    rawInvestmentValue > 0
      ? ((rawCurrentValue - rawInvestmentValue) / rawInvestmentValue) * 100
      : 0;

  return {
    rawInvestmentValue,
    rawCurrentValue,
    rawProfit,
    rawLoss,
    investmentValue: round2(rawInvestmentValue),
    currentValue: round2(rawCurrentValue),
    netGainLoss: round2(rawNetGainLoss),
    profit: round2(rawProfit),
    loss: round2(rawLoss),
    returnPercentage: round2(rawReturnPercentage),
  };
}

export function computePortfolioAnalytics(items: InvestmentRecord[]): {
  holdings: ComputedInvestment[];
  summary: PortfolioSummary;
} {
  let rawTotalInvestment = 0;
  let rawCurrentPortfolioValue = 0;
  let rawGrossProfit = 0;
  let rawGrossLoss = 0;

  const precomputed = items.map((item) => {
    const metrics = calculateHoldingMetrics(
      Number(item.units),
      Number(item.purchasePrice),
      Number(item.currentPrice)
    );
    rawTotalInvestment += metrics.rawInvestmentValue;
    rawCurrentPortfolioValue += metrics.rawCurrentValue;
    rawGrossProfit += metrics.rawProfit;
    rawGrossLoss += metrics.rawLoss;

    return {
      record: {
        ...item,
        investmentValue: metrics.investmentValue,
        currentValue: metrics.currentValue,
        netGainLoss: metrics.netGainLoss,
        profit: metrics.profit,
        loss: metrics.loss,
        returnPercentage: metrics.returnPercentage,
        portfolioShare: 0,
      },
      rawInvestmentValue: metrics.rawInvestmentValue,
      rawCurrentValue: metrics.rawCurrentValue,
    };
  });

  const holdings: ComputedInvestment[] = precomputed.map(({ record, rawCurrentValue }) => ({
    ...record,
    portfolioShare:
      rawCurrentPortfolioValue > 0
        ? round2((rawCurrentValue / rawCurrentPortfolioValue) * 100)
        : 0,
  }));

  const rawNetGainLoss = rawCurrentPortfolioValue - rawTotalInvestment;
  const rawProfit = rawNetGainLoss > 0 ? rawNetGainLoss : 0;
  const rawLoss = rawNetGainLoss < 0 ? rawTotalInvestment - rawCurrentPortfolioValue : 0;
  const rawReturnPercentage =
    rawTotalInvestment > 0
      ? ((rawCurrentPortfolioValue - rawTotalInvestment) / rawTotalInvestment) * 100
      : 0;

  const categoryAllocation: CategoryAllocationItem[] = INVESTMENT_CATEGORIES.map(
    (category) => {
      const group = precomputed.filter((p) => p.record.category === category);
      const rawCatInvested = group.reduce((sum, p) => sum + p.rawInvestmentValue, 0);
      const rawCatCurrent = group.reduce((sum, p) => sum + p.rawCurrentValue, 0);
      const rawCatNet = rawCatCurrent - rawCatInvested;
      const rawCatProfit = rawCatNet > 0 ? rawCatNet : 0;
      const rawCatLoss = rawCatNet < 0 ? rawCatInvested - rawCatCurrent : 0;
      const rawCatReturn =
        rawCatInvested > 0 ? ((rawCatCurrent - rawCatInvested) / rawCatInvested) * 100 : 0;
      const rawAllocationPct =
        rawCurrentPortfolioValue > 0
          ? (rawCatCurrent / rawCurrentPortfolioValue) * 100
          : 0;

      return {
        category,
        investedValue: round2(rawCatInvested),
        currentValue: round2(rawCatCurrent),
        profit: round2(rawCatProfit),
        loss: round2(rawCatLoss),
        netGainLoss: round2(rawCatNet),
        returnPercentage: round2(rawCatReturn),
        allocationPercentage: round2(rawAllocationPct),
        count: group.length,
      };
    }
  );

  return {
    holdings,
    summary: {
      totalInvestment: round2(rawTotalInvestment),
      currentPortfolioValue: round2(rawCurrentPortfolioValue),
      netGainLoss: round2(rawNetGainLoss),
      profit: round2(rawProfit),
      loss: round2(rawLoss),
      grossProfit: round2(rawGrossProfit),
      grossLoss: round2(rawGrossLoss),
      returnPercentage: round2(rawReturnPercentage),
      holdingsCount: holdings.length,
      categoryAllocation,
    },
  };
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  const safeAmount = round2(amount);
  const safeCurrency = currency || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `$${safeAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatPercent(value: number): string {
  const safe = round2(value);
  const sign = safe > 0 ? '+' : '';
  return `${sign}${safe.toFixed(2)}%`;
}
