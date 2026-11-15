import {
  ComputedInvestment,
  InvestmentCategory,
  PortfolioSummary,
} from '../utils/calculations';

export interface AuthUser {
  id: number;
  uid: string;
  fullName: string;
  email: string;
  role: 'investor' | 'admin';
  status: 'active' | 'inactive';
  phone: string;
  currency: string;
  riskProfile: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioResponse {
  holdings: ComputedInvestment[];
  summary: PortfolioSummary;
}

export interface PortfolioReportResponse {
  generatedAt: string;
  statementDate: string;
  investor: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    currency: string;
    riskProfile: string;
    memberSince: string;
  };
  summary: PortfolioSummary;
  holdings: ComputedInvestment[];
}

export interface ActivityLogItem {
  id: number;
  userId: number | null;
  actorEmail: string;
  action: string;
  entityType: string;
  details: string;
  createdAt: string;
}

export interface AdminUserItem extends AuthUser {
  holdingsCount: number;
  totalInvested: number;
  totalCurrent: number;
}

export interface AdminOverviewResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  investorCount: number;
  adminCount: number;
  totalHoldings: number;
  aggregateInvested: number;
  aggregateCurrentValue: number;
  recentLogs: ActivityLogItem[];
  recentInquiries: Array<{
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  }>;
}

export interface InvestmentPayload {
  category: InvestmentCategory;
  assetName: string;
  symbol?: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes?: string;
}

export interface MarketNewsItem {
  headline: string;
  relatedSymbols: string[];
  sentiment: 'Positive' | 'Neutral' | 'Watch';
  summary: string;
  publishedContext?: string;
}

export interface MarketNewsSource {
  title: string;
  url: string;
  domain: string;
}

export interface MarketNewsResponse {
  items: MarketNewsItem[];
  sources: MarketNewsSource[];
  searchQueries: string[];
  focus: string;
  portfolioSymbols: string[];
  generatedAt: string;
  fallbackText?: string;
}

let tokenGetter: () => Promise<string | null> = async () => null;

export function registerTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requireAuthHeader = true
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireAuthHeader) {
    const token = await tokenGetter();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`
    );
  }
  return payload as T;
}

export const apiClient = {
  registerInvestor(data: {
    fullName: string;
    email: string;
    password: string;
    currency: string;
    riskProfile: string;
  }) {
    return apiRequest<{ user: AuthUser }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );
  },

  login(data: { email: string; password: string; portal?: 'investor' | 'admin' }) {
    return apiRequest<{ user: AuthUser }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );
  },

  logout() {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  syncFirebaseSession(idToken: string) {
    return apiRequest<{ user: AuthUser }>(
      '/auth/firebase',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
      false
    );
  },

  getCurrentUser() {
    return apiRequest<{ user: AuthUser }>('/auth/me');
  },

  updateProfile(data: {
    fullName: string;
    phone: string;
    currency: string;
    riskProfile: string;
  }) {
    return apiRequest<{ user: AuthUser }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return apiRequest<{ message: string }>('/profile/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getInvestments() {
    return apiRequest<PortfolioResponse>('/investments');
  },

  async createInvestment(data: InvestmentPayload) {
    const res = await apiRequest<{ investment: ComputedInvestment }>('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portfolio:updated'));
    }
    return res;
  },

  async updateInvestment(id: number, data: InvestmentPayload) {
    const res = await apiRequest<{ investment: ComputedInvestment }>(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portfolio:updated'));
    }
    return res;
  },

  async deleteInvestment(id: number) {
    const res = await apiRequest<{ message: string; id: number }>(`/investments/${id}`, {
      method: 'DELETE',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portfolio:updated'));
    }
    return res;
  },

  logReportExport(format: string) {
    return apiRequest<{ ok: boolean }>('/investments/report-log', {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  },

  submitContact(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return apiRequest<{ message: string; inquiryId: number }>(
      '/contact',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );
  },

  getAdminOverview() {
    return apiRequest<AdminOverviewResponse>('/admin/overview');
  },

  getAdminUsers() {
    return apiRequest<{ users: AdminUserItem[] }>('/admin/users');
  },

  updateAdminUserStatus(userId: number, status: 'active' | 'inactive') {
    return apiRequest<{ user: AuthUser }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getAdminActivities(limit = 100) {
    return apiRequest<{ activities: ActivityLogItem[] }>(
      `/admin/activities?limit=${limit}`
    );
  },

  getMarketNews(options?: { focus?: string; refresh?: boolean }) {
    const params = new URLSearchParams();
    if (options?.focus && options.focus !== 'ALL') {
      params.set('focus', options.focus);
    }
    if (options?.refresh) {
      params.set('refresh', '1');
    }
    const qs = params.toString();
    return apiRequest<MarketNewsResponse>(
      `/market-news${qs ? `?${qs}` : ''}`
    );
  },

  getPortfolioReport() {
    return apiRequest<PortfolioReportResponse>('/reports/portfolio');
  },

  async downloadPortfolioReport(format: 'pdf' | 'csv'): Promise<{
    blob: Blob;
    filename: string;
  }> {
    const headers = new Headers();
    const token = await tokenGetter();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api/reports/portfolio/${format}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error(
        typeof errPayload?.error === 'string'
          ? errPayload.error
          : `Report export failed with status ${response.status}`
      );
    }

    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const today = new Date().toISOString().slice(0, 10);
    const filename = match?.[1] || `portfolio-report-${today}.${format}`;
    const blob = await response.blob();
    return { blob, filename };
  },
};
