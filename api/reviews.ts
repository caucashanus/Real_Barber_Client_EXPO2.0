import { CrmHttpError, fetchCrm } from './http';

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
  return fetchCrm<ClientOverviewResponse>('/api/client/overview', { apiToken });
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

  return fetchCrm<GetClientReviewsListResponse>(`/api/client/reviews${qs ? `?${qs}` : ''}`, {
    apiToken,
  });
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

  try {
    return await fetchCrm<GetEntityReviewsResponse>(
      `/api/client/reviews/entity/${entityType}/${entityId}${qs ? `?${qs}` : ''}`,
      { apiToken }
    );
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Not found');
    throw e;
  }
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
  try {
    return await fetchCrm('/api/client/reviews', {
      method: 'POST',
      apiToken,
      body: {
        entityType: params.entityType,
        entityId: params.entityId,
        rating: params.rating,
        description: params.description ?? '',
        positiveFeedback: params.positiveFeedback ?? params.description ?? '',
        negativeFeedback: params.negativeFeedback ?? '',
        isAnonymous: params.isAnonymous ?? false,
      },
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 409) {
      throw new Error('You have already reviewed this.');
    }
    throw e;
  }
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
  try {
    return await fetchCrm(`/api/client/reviews/${reviewId}`, {
      method: 'PATCH',
      apiToken,
      body: {
        rating: params.rating,
        description: params.description ?? '',
        positiveFeedback: params.positiveFeedback ?? params.description ?? '',
        negativeFeedback: params.negativeFeedback ?? '',
        isAnonymous: params.isAnonymous,
      },
    });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 403) throw new Error('Forbidden');
      if (e.status === 404) throw new Error('Review not found');
    }
    throw e;
  }
}

/** DELETE /api/client/reviews/[id] – delete own review. */
export async function deleteReview(apiToken: string, reviewId: string): Promise<void> {
  try {
    await fetchCrm<void>(`/api/client/reviews/${reviewId}`, {
      method: 'DELETE',
      apiToken,
    });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 403) throw new Error('Forbidden');
      if (e.status === 404) throw new Error('Review not found');
    }
    throw e;
  }
}
