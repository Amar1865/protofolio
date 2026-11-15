import { useCallback, useEffect, useState } from 'react';
import { apiClient, PortfolioResponse } from '../services/api';

const EMPTY_SUMMARY: PortfolioResponse = {
  holdings: [],
  summary: {
    totalInvestment: 0,
    currentPortfolioValue: 0,
    netGainLoss: 0,
    profit: 0,
    loss: 0,
    grossProfit: 0,
    grossLoss: 0,
    returnPercentage: 0,
    holdingsCount: 0,
    categoryAllocation: [
      {
        category: 'Stocks',
        investedValue: 0,
        currentValue: 0,
        profit: 0,
        loss: 0,
        netGainLoss: 0,
        returnPercentage: 0,
        allocationPercentage: 0,
        count: 0,
      },
      {
        category: 'Mutual Funds',
        investedValue: 0,
        currentValue: 0,
        profit: 0,
        loss: 0,
        netGainLoss: 0,
        returnPercentage: 0,
        allocationPercentage: 0,
        count: 0,
      },
      {
        category: 'Others',
        investedValue: 0,
        currentValue: 0,
        profit: 0,
        loss: 0,
        netGainLoss: 0,
        returnPercentage: 0,
        allocationPercentage: 0,
        count: 0,
      },
    ],
  },
};

export function usePortfolio() {
  const [data, setData] = useState<PortfolioResponse>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getInvestments();
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Unable to load portfolio records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdated = () => {
      reload();
    };
    window.addEventListener('portfolio:updated', handleUpdated);
    return () => window.removeEventListener('portfolio:updated', handleUpdated);
  }, [reload]);

  return {
    holdings: data.holdings,
    summary: data.summary,
    loading,
    error,
    reload,
  };
}
