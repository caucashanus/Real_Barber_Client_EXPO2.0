import { CRM_BASE } from '@/api/bookings';
import { checkAuthResponse } from './http';

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
  const res = await fetch(`${CRM_BASE}/api/client/posters`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  checkAuthResponse(res);
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data as ClientPoster[];
}
