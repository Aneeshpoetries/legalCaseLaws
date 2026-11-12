import type {
  Category,
  Authority,
  LegalUpdate,
  SourceRegistryItem,
  SourceDocument,
  StorageOverview,
  RetentionPolicy,
  CleanupLog,
  AnalyticsData,
} from './types.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mk_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Public
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  async getAuthorities(): Promise<Authority[]> {
    const res = await fetch(`${API_BASE}/authorities`);
    if (!res.ok) throw new Error('Failed to load authorities');
    return res.json();
  },

  async getUpdates(params?: {
    q?: string;
    category?: string;
    authority?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ updates: LegalUpdate[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.authority) query.set('authority', params.authority);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/updates?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load legal updates');
    return res.json();
  },

  async getUpdateBySlug(slug: string): Promise<LegalUpdate> {
    const res = await fetch(`${API_BASE}/updates/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Legal update not found');
    return res.json();
  },

  async getDailyBulletin(date?: string): Promise<{
    date: string;
    totalUpdates: number;
    updates: LegalUpdate[];
    categoryGroups: Array<{ category: string; slug: string; items: LegalUpdate[] }>;
    authorityGroups: Array<{ authority: string; code: string; items: LegalUpdate[] }>;
    publisher: string;
  }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE}/bulletins${query}`);
    if (!res.ok) throw new Error('Failed to load daily bulletin');
    return res.json();
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: any }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Admin APIs
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async getSources(): Promise<SourceRegistryItem[]> {
    const res = await fetch(`${API_BASE}/sources`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load sources');
    return res.json();
  },

  async addSource(data: {
    authority_id: number;
    name: string;
    source_type: string;
    url: string;
    fetch_interval_mins: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add source');
    }
    return res.json();
  },

  async toggleSource(sourceId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sources/${sourceId}/toggle`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to toggle source');
    return res.json();
  },

  async crawlSource(sourceId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sources/${sourceId}/crawl`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Collection failed');
    }
    return res.json();
  },

  async getDocuments(): Promise<SourceDocument[]> {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async submitManualDocument(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/manual`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to ingest document');
    }
    return res.json();
  },

  async getResearchQueue(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/research/queue`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load review queue');
    return res.json();
  },

  async getResearchDetail(updateId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/research/${updateId}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load research detail');
    return res.json();
  },

  async updateResearch(updateId: number, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/research/${updateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update research');
    return res.json();
  },

  async regenerateSection(updateId: number, sectionKey: string, instruction?: string): Promise<{ sectionKey: string; revisedText: string }> {
    const res = await fetch(`${API_BASE}/research/${updateId}/regenerate-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ sectionKey, instruction }),
    });
    if (!res.ok) throw new Error('Failed to regenerate section');
    return res.json();
  },

  async approveUpdate(updateId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/research/${updateId}/approve`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to approve update');
    return res.json();
  },

  async rejectUpdate(updateId: number, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/research/${updateId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject update');
    return res.json();
  },

  async unpublishUpdate(updateId: number, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/updates/${updateId}/unpublish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to unpublish update');
    return res.json();
  },

  async getStorageOverview(): Promise<StorageOverview> {
    const res = await fetch(`${API_BASE}/storage/overview`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load storage overview');
    return res.json();
  },

  async runMidnightCleanup(): Promise<any> {
    const res = await fetch(`${API_BASE}/storage/cleanup`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Cleanup execution failed');
    return res.json();
  },

  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    const res = await fetch(`${API_BASE}/storage/policies`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load retention policies');
    return res.json();
  },

  async updateRetentionPolicy(id: number, data: { retention_hours: number; is_active?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/storage/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update retention policy');
    return res.json();
  },

  async getCleanupLogs(): Promise<CleanupLog[]> {
    const res = await fetch(`${API_BASE}/storage/cleanup-logs`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load cleanup logs');
    return res.json();
  },

  async addAuthority(data: {
    code: string;
    name: string;
    category_id?: number;
    website_url?: string;
    jurisdiction?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/authorities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add authority');
    }
    return res.json();
  },

  async addCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add category');
    }
    return res.json();
  },
};
