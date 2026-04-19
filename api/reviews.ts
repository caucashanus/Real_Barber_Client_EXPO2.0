const CRM_BASE = 'https://crm.xrb.cz';

/** Reservation/product from client overview with optional reviews. */
export interface ClientOverviewReservation {
  id: string;
  reviews?: { id: string; rating: number; [key: string]: unknown }[];
  [key: string]: unknown;
}

export interface ClientOverviewResponse {
  data?: {
    reservations?: {
      withReviews?: ClientOverviewReservation[];
      withoutReviews?: ClientOverviewReservation[];
    };
    products?: {
      withReviews?: unknown[];
      withoutReviews?: unknown[];
    };
  };
}

/** GET /api/client/overview – reservations/products with and without reviews (for Rated / Pending review). */
export async function getClientOverview(apiToken: string): Promise<ClientOverviewResponse> {
  const res = await fetch(`${CRM_BASE}/api/client/overview`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<ClientOverviewResponse>;
}

export interface EntityReviewClient {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface EntityReviewItem {
  id: string;
  rating: number;
  positiveFeedback: string | null;
  negativeFeedback: string | null;
  description: string | null;
  images: string[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  client: EntityReviewClient;
  entityType?: string;
  entityId?: string;
}

export interface GetEntityReviewsOptions {
  page?: number;
  limit?: number;
  includeOwn?: boolean;
}

export interface GetEntityReviewsResponse {
  entity: { id: string; name: string };
  clientReview: EntityReviewItem | null;
  hasReviewed: boolean;
  reviews: EntityReviewItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ClientReviewListItem {
  id: string;
  rating: number;
  entityType: string;
  entityId: string;
  [key: string]: unknown;
}

export interface GetClientReviewsListResponse {
  reviews: ClientReviewListItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/** GET /api/client/reviews – list all reviews with optional entityType filter (e.g. employee). */
export async function getClientReviewsList(
  apiToken: string,
  options: { entityType?: string; limit?: number; page?: number } = {}
): Promise<GetClientReviewsListResponse> {
  const params = new URLSearchParams();
  if (options.entityType) params.set('entityType', options.entityType);
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.page != null) params.set('page', String(options.page));
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/reviews${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<GetClientReviewsListResponse>;
}

/** GET /api/client/reviews/entity/[entityType]/[entityId] – list reviews for one entity (e.g. branch). */
export async function getEntityReviews(
  apiToken: string,
  entityType: 'branch' | 'reservation' | 'item' | 'sale_log' | 'employee',
  entityId: string,
  options: GetEntityReviewsOptions = {}
): Promise<GetEntityReviewsResponse> {
  const params = new URLSearchParams();
  if (options.page != null) params.set('page', String(options.page));
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.includeOwn === true) params.set('includeOwn', 'true');
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/reviews/entity/${entityType}/${entityId}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<GetEntityReviewsResponse>;
}

export interface CreateReviewParams {
  entityType: 'branch' | 'reservation' | 'item' | 'sale_log' | 'employee';
  entityId: string;
  rating: number;
  description?: string;
  positiveFeedback?: string;
  negativeFeedback?: string;
  isAnonymous?: boolean;
}

/** POST /api/client/reviews – create a review for an entity. */
export async function createReview(
  apiToken: string,
  params: CreateReviewParams
): Promise<{
  id: string;
  rating: number;
  description: string | null;
  createdAt: string;
  [key: string]: unknown;
}> {
  const res = await fetch(`${CRM_BASE}/api/client/reviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entityType: params.entityType,
      entityId: params.entityId,
      rating: params.rating,
      description: params.description ?? '',
      positiveFeedback: params.positiveFeedback ?? params.description ?? '',
      negativeFeedback: params.negativeFeedback ?? '',
      isAnonymous: params.isAnonymous ?? false,
    }),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 409) throw new Error('You have already reviewed this.');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json();
}

export interface UpdateReviewParams {
  rating?: number;
  description?: string;
  positiveFeedback?: string;
  negativeFeedback?: string;
  isAnonymous?: boolean;
}

/** PATCH /api/client/reviews/[id] – update own review. */
export async function updateReview(
  apiToken: string,
  reviewId: string,
  params: UpdateReviewParams
): Promise<{
  id: string;
  rating: number;
  description: string | null;
  updatedAt: string;
  [key: string]: unknown;
}> {
  const res = await fetch(`${CRM_BASE}/api/client/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating: params.rating,
      description: params.description ?? '',
      positiveFeedback: params.positiveFeedback ?? params.description ?? '',
      negativeFeedback: params.negativeFeedback ?? '',
      isAnonymous: params.isAnonymous,
    }),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (res.status === 404) throw new Error('Review not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json();
}

/** DELETE /api/client/reviews/[id] – delete own review. */
export async function deleteReview(apiToken: string, reviewId: string): Promise<void> {
  const res = await fetch(`${CRM_BASE}/api/client/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (res.status === 404) throw new Error('Review not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
