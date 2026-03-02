const CRM_BASE = 'https://crm.xrb.cz';

export interface ClientSearchItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: { city: string | null; country: string | null };
  joinedAt: string;
  hasApp: boolean;
  social?: { followersCount: number; followingCount: number };
}

export interface ClientSearchResponse {
  clients: ClientSearchItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  search: { query: string; sortBy: string; sortOrder: string; resultsCount: number };
  searchedAt: string;
}

/**
 * GET /api/client/clients/search – search other clients by name, display name, or phone.
 * Min 2 characters. Excludes current user. Use for RBC recipient lookup by phone.
 */
export async function searchClients(
  apiToken: string,
  query: string,
  options?: { limit?: number; offset?: number }
): Promise<ClientSearchResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return {
      clients: [],
      pagination: { total: 0, limit: options?.limit ?? 20, offset: options?.offset ?? 0, hasMore: false },
      search: { query: q, sortBy: 'name', sortOrder: 'asc', resultsCount: 0 },
      searchedAt: new Date().toISOString(),
    };
  }
  const params = new URLSearchParams({ query: q });
  if (options?.limit != null) params.set('limit', String(Math.min(options.limit, 50)));
  if (options?.offset != null) params.set('offset', String(options.offset));
  const url = `${CRM_BASE}/api/client/clients/search?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Neplatný dotaz');
  }
  if (!res.ok) throw new Error(`Chyba ${res.status}`);

  return res.json() as Promise<ClientSearchResponse>;
}
