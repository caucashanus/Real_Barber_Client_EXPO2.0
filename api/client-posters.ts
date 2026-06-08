import { fetchCrm } from './http';

/** Záznam marketingového plakátu z GET /api/client/posters (bez interních CRM polí). */
export interface ClientPoster {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  websiteUrl: string | null;
  sortOrder: number;
}

/** GET /api/client/posters — aktivní plakáty, server řadí sortOrder vzestupně. */
export async function getClientPosters(apiToken: string): Promise<ClientPoster[]> {
  const data = await fetchCrm<unknown>('/api/client/posters', { apiToken });
  if (!Array.isArray(data)) return [];
  return data as ClientPoster[];
}
