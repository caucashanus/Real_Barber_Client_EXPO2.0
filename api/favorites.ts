import { CrmHttpError, fetchCrm } from './http';

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
export async function addFavorite(apiToken: string, body: AddFavoriteBody): Promise<Favorite> {
  try {
    return await fetchCrm<Favorite>('/api/client/favorites', {
      method: 'POST',
      apiToken,
      body: {
        entityType: body.entityType,
        entityId: body.entityId,
        title: body.title ?? '',
        note: body.note ?? '',
        tags: body.tags ?? [],
        category: body.category ?? '',
        order: body.order ?? 1,
      },
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 409) throw new Error('Already in favorites');
    throw e;
  }
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

  const data = await fetchCrm<unknown>(`/api/client/favorites${qs ? `?${qs}` : ''}`, { apiToken });
  if (Array.isArray(data)) return data;
  const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return (
    Array.isArray(obj.items) ? obj.items : Array.isArray(obj.favorites) ? obj.favorites : []
  ) as Favorite[];
}

/** GET /api/client/favorites/[id] – get one favorite by id. */
export async function getFavoriteById(apiToken: string, id: string): Promise<Favorite> {
  try {
    return await fetchCrm<Favorite>(`/api/client/favorites/${encodeURIComponent(id)}`, {
      apiToken,
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Not found');
    throw e;
  }
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
  try {
    return await fetchCrm<Favorite>(`/api/client/favorites/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      apiToken,
      body,
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Not found');
    throw e;
  }
}

/** DELETE /api/client/favorites/[id] – remove a favorite. */
export async function deleteFavorite(apiToken: string, id: string): Promise<void> {
  try {
    await fetchCrm<void>(`/api/client/favorites/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      apiToken,
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Not found');
    throw e;
  }
}
