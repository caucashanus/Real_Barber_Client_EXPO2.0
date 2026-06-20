import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';

import { CrmHttpError, fetchClientAppV1, fetchCrm } from './http';

export interface ItemMedia {
  url: string;
  type?: 'image' | 'video';
  order?: number;
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  categoryId?: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  media?: ItemMedia[];
  [key: string]: unknown;
}

export interface ItemsPagination {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ItemsResponse {
  items: Item[];
  totalCount: number;
  returnedCount: number;
  category?: string | null;
  pagination: ItemsPagination;
  requestedAt?: string;
}

export interface GetItemsOptions {
  category?: string;
  includeMedia?: boolean;
  includeEmployees?: boolean;
  limit?: number;
  offset?: number;
}

/** Card / list thumbnail — prefers v1 `thumbnailUrl` when present. */
export function itemListImageUrl(item: Item): string | null {
  const thumb = item.thumbnailUrl?.trim();
  if (thumb) return thumb;
  const image = item.imageUrl?.trim();
  return image || null;
}

export async function getItems(
  apiToken: string,
  options: GetItemsOptions = {}
): Promise<ItemsResponse> {
  if (CLIENT_APP_V1_ENABLED) {
    const items = await fetchItemsV1List(apiToken, options);
    return {
      items,
      totalCount: items.length,
      returnedCount: items.length,
      category: options.category ?? null,
      pagination: {
        limit: items.length,
        offset: options.offset ?? 0,
        hasMore: false,
      },
    };
  }

  const params = new URLSearchParams();
  if (options.category !== undefined) params.set('category', options.category);
  if (options.includeMedia !== undefined) params.set('includeMedia', String(options.includeMedia));
  if (options.includeEmployees !== undefined)
    params.set('includeEmployees', String(options.includeEmployees));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  const qs = params.toString();

  return fetchCrm<ItemsResponse>(`/api/client/items${qs ? `?${qs}` : ''}`, { apiToken });
}

async function fetchItemsV1List(apiToken: string, options: GetItemsOptions = {}): Promise<Item[]> {
  const params = new URLSearchParams();
  if (options.category !== undefined) params.set('category', options.category);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  const qs = params.toString();
  return fetchClientAppV1<Item[]>(`/items${qs ? `?${qs}` : ''}`, { apiToken });
}

/** GET /api/client/app/v1/items/:id — detail služby (description + media). */
export async function getItemById(apiToken: string, itemId: string): Promise<Item> {
  if (CLIENT_APP_V1_ENABLED) {
    try {
      return await fetchClientAppV1<Item>(`/items/${encodeURIComponent(itemId)}`, { apiToken });
    } catch (e) {
      if (e instanceof CrmHttpError && e.status === 404) throw new Error('Service not found');
      throw e;
    }
  }

  const all = await getItemsAll(apiToken, { includeMedia: true, includeEmployees: false, limit: 50 });
  const found = all.find((i) => i.id === itemId);
  if (!found) throw new Error('Service not found');
  return found;
}

const DEFAULT_PAGE_SIZE = 50;

/** Fetches all items by requesting pages until hasMore is false (legacy) or single v1 list call. */
export async function getItemsAll(
  apiToken: string,
  options: Omit<GetItemsOptions, 'offset'> = {}
): Promise<Item[]> {
  if (CLIENT_APP_V1_ENABLED) {
    return fetchItemsV1List(apiToken, options);
  }

  const all: Item[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await getItems(apiToken, {
      ...options,
      limit: options.limit ?? DEFAULT_PAGE_SIZE,
      offset,
    });
    all.push(...res.items);
    hasMore = res.pagination?.hasMore ?? false;
    offset += res.items.length;
    if (res.items.length === 0) break;
  }

  return all;
}
