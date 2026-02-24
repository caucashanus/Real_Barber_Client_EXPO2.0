const CRM_BASE = 'https://crm.xrb.cz';

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  media?: unknown[];
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

export async function getItems(
  apiToken: string,
  options: GetItemsOptions = {}
): Promise<ItemsResponse> {
  const params = new URLSearchParams();
  if (options.category !== undefined) params.set('category', options.category);
  if (options.includeMedia !== undefined) params.set('includeMedia', String(options.includeMedia));
  if (options.includeEmployees !== undefined) params.set('includeEmployees', String(options.includeEmployees));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/items${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ItemsResponse>;
}

const DEFAULT_PAGE_SIZE = 50;

/** Fetches all items by requesting pages until hasMore is false. */
export async function getItemsAll(
  apiToken: string,
  options: Omit<GetItemsOptions, 'offset'> = {}
): Promise<Item[]> {
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
