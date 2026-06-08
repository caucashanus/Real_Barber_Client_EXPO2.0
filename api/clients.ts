import { CrmHttpError, fetchCrm } from './http';

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
 * GET /api/client/clients/search – CRM hledání klientů (jméno / telefon podle backendu).
 * V aplikaci (Nová platba) se pro klienty volá jen s kompletním normalizovaným telefonem (420…).
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
      pagination: {
        total: 0,
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
        hasMore: false,
      },
      search: { query: q, sortBy: 'name', sortOrder: 'asc', resultsCount: 0 },
      searchedAt: new Date().toISOString(),
    };
  }
  const params = new URLSearchParams({ query: q });
  if (options?.limit != null) params.set('limit', String(Math.min(options.limit, 50)));
  if (options?.offset != null) params.set('offset', String(options.offset));

  try {
    return await fetchCrm<ClientSearchResponse>(`/api/client/clients/search?${params.toString()}`, {
      apiToken,
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 400) {
      throw new Error(e.message || 'Neplatný dotaz');
    }
    throw e;
  }
}
