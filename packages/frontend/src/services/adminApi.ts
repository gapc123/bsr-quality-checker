const BASE = '/api/admin';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status });
  }
  return res.json();
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ ok: boolean; email: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>('/logout', { method: 'POST' }),

  me: () => request<{ email: string }>('/me'),

  submissions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{
      submissions: Submission[];
      total: number;
      stats: SubmissionStats;
    }>(`/submissions${qs}`);
  },

  submission: (id: string) => request<Submission>(`/submissions/${id}`),

  organisations: () => request<Organisation[]>('/organisations'),

  costs: () => request<CostStats>('/costs'),

  health: () => request<HealthData>('/health'),

  showcase: () => request<ShowcaseData>('/showcase'),

  exportSubmissions: () => window.open(`${BASE}/export/submissions`, '_blank'),
  exportOrganisations: () => window.open(`${BASE}/export/organisations`, '_blank'),
};

export interface Submission {
  id: string;
  orgName: string;
  orgId: string;
  userEmail: string;
  createdAt: string;
  completedAt: string | null;
  processingTimeSeconds: number | null;
  documentCount: number;
  documentNames: string[];
  totalChecksRun: number;
  checksPassed: number;
  checksPartial: number;
  checksFailed: number;
  regulatoryReadinessScore: number | null;
  failureCategories: string[];
  apiCallsMade: number;
  tokensInput: number;
  tokensOutput: number;
  estimatedApiCostGbp: number;
  status: string;
  errorMessage: string | null;
}

export interface Organisation {
  id: string;
  name: string;
  primaryEmail: string;
  createdAt: string;
  lastActiveAt: string;
  submissionCount: number;
  isPilot: boolean;
  isActive: boolean;
}

export interface SubmissionStats {
  allTime: number;
  last30Days: number;
  avgReadinessScore: number | null;
  avgProcessingSeconds: number | null;
}

export interface CostStats {
  totalApiCalls: number;
  totalSpendGbp: number;
  avgCostPerSubmission: number;
  avgTokensInput: number;
  avgTokensOutput: number;
  totalSubmissions: number;
  errorRate: number;
}

export interface HealthData {
  stuckSubmissions: { id: string; orgName: string; createdAt: string; minutesStuck: number }[];
  recentErrors: { id: string; orgName: string; createdAt: string; errorMessage: string | null }[];
}

export interface ShowcaseData {
  headline: {
    totalAssessments: number;
    totalOrgs: number;
    totalGaps: number;
    totalDocs: number;
    avgReadiness: number;
  };
  passFailSplit: { label: string; value: number }[];
  failureCategories: { category: string; count: number }[];
  readinessHistogram: { label: string; count: number }[];
  assessmentsPerMonth: { month: string; count: number }[];
  cumulativeOrgs: { month: string; cumulative: number }[];
}
