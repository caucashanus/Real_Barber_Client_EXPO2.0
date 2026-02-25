const CRM_BASE = 'https://crm.xrb.cz';

export type FavoriteEntityType =
  | 'product'
  | 'service'
  | 'branch'
  | 'employee'
  | 'item'
  | 'promotion'
  | 'guide'
  | string;

export interface AddFavoriteBody {
  entityType: FavoriteEntityType;
  entityId: string;
  title?: string;
  note?: string;
  tags?: string[];
  category?: string;
  order?: number;
}

export interface Favorite {
  id: string;
  entityType: string;
  entityId: string;
  title?: string | null;
  note?: string | null;
  category?: string | null;
  order?: number;
  tags?: string[];
  createdAt?: string;
  [key: string]: unknown;
}

/** POST /api/client/favorites – add a new favorite. Returns 200 with created favorite, 409 if already exists. */
export async function addFavorite(
  apiToken: string,
  body: AddFavoriteBody
): Promise<Favorite> {
  const res = await fetch(`${CRM_BASE}/api/client/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      entityType: body.entityType,
      entityId: body.entityId,
      title: body.title ?? '',
      note: body.note ?? '',
      tags: body.tags ?? [],
      category: body.category ?? '',
      order: body.order ?? 1,
    }),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 409) throw new Error('Already in favorites');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<Favorite>;
}

export interface GetFavoritesOptions {
  entityType?: string;
  category?: string;
}

/** GET /api/client/favorites – list all favorites. */
export async function getFavorites(
  apiToken: string,
  options: GetFavoritesOptions = {}
): Promise<Favorite[]> {
  const params = new URLSearchParams();
  if (options.entityType != null) params.set('entityType', options.entityType);
  if (options.category != null) params.set('category', options.category);
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/favorites${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? data : (data.items ?? data.favorites ?? []);
}

/** GET /api/client/favorites/[id] – get one favorite by id. */
export async function getFavoriteById(apiToken: string, id: string): Promise<Favorite> {
  const res = await fetch(`${CRM_BASE}/api/client/favorites/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<Favorite>;
}

export interface UpdateFavoriteBody {
  title?: string;
  note?: string;
  tags?: string[];
  category?: string;
  order?: number;
}

/** PATCH /api/client/favorites/[id] – update a favorite. */
export async function updateFavorite(
  apiToken: string,
  id: string,
  body: UpdateFavoriteBody
): Promise<Favorite> {
  const res = await fetch(`${CRM_BASE}/api/client/favorites/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<Favorite>;
}

/** DELETE /api/client/favorites/[id] – remove a favorite. */
export async function deleteFavorite(apiToken: string, id: string): Promise<void> {
  const res = await fetch(`${CRM_BASE}/api/client/favorites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
