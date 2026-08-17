import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import { getEntityReviews, getEntityReviewsForService } from '@/api/reviews';
import type { EntityReviewItem, GetEntityReviewsResponse } from '@/api/reviews';
import { buildOwnReviewIds } from '@/utils/barberDetailHelpers';

export type PublicReviewEntityType = 'branch' | 'employee' | 'service';

export type MergedPublicPageReviews = {
  reviews: TeamMemberPageReview[];
  statsTotal: number;
  hasReviewed: boolean;
  ownReviewIds: Set<string>;
};

/** Fetch own review via client API and merge into public page reviews (detail screens). */
export async function fetchMergedPageReviewsWithOwn(options: {
  apiToken?: string | null;
  entityType: PublicReviewEntityType;
  entityId?: string;
  pageReviews: TeamMemberPageReview[];
  statsTotal: number;
  clientId?: string | number | null;
}): Promise<MergedPublicPageReviews> {
  const { apiToken, entityType, entityId, pageReviews, statsTotal, clientId } = options;

  if (!apiToken || !entityId) {
    return {
      reviews: pageReviews,
      statsTotal,
      hasReviewed: false,
      ownReviewIds: new Set(),
    };
  }

  try {
    const ownData =
      entityType === 'service'
        ? await getEntityReviewsForService(apiToken, entityId, {
            page: 1,
            limit: 100,
            includeOwn: true,
          })
        : await getEntityReviews(apiToken, entityType, entityId, {
            page: 1,
            limit: 100,
            includeOwn: true,
          });

    const merged = mergePageReviewsWithOwnReview(pageReviews, ownData, clientId);
    return {
      reviews: merged.reviews,
      statsTotal: bumpStatsTotalForAddedReview(statsTotal, merged.reviews, merged.addedReview),
      hasReviewed: merged.hasReviewed,
      ownReviewIds: merged.ownReviewIds,
    };
  } catch {
    return {
      reviews: pageReviews,
      statsTotal,
      hasReviewed: false,
      ownReviewIds: new Set(),
    };
  }
}

export function mapPublicPageReviewToEntityReview(
  review: TeamMemberPageReview,
  entityType: 'employee' | 'branch' | 'service',
  entityId: string
): EntityReviewItem {
  return {
    id: review.id,
    rating: review.rating,
    positiveFeedback: review.text ?? null,
    negativeFeedback: null,
    description: review.text ?? null,
    images: review.images ?? [],
    isAnonymous: !review.authorName?.trim(),
    createdAt: review.createdAt ?? new Date().toISOString(),
    updatedAt: review.createdAt ?? new Date().toISOString(),
    client: {
      id: review.id,
      name: review.authorName?.trim() || 'Anonymous',
      firstName: review.authorName?.trim() || null,
      lastName: null,
      avatarUrl: review.authorAvatarUrl ?? null,
    },
    entityType,
    entityId,
  };
}

export function mapEntityReviewToPageReview(review: EntityReviewItem): TeamMemberPageReview {
  const text = review.description ?? review.positiveFeedback ?? null;
  return {
    id: review.id,
    rating: review.rating,
    text,
    authorName: review.isAnonymous ? null : review.client?.name?.trim() || null,
    authorAvatarUrl: review.isAnonymous ? null : review.client?.avatarUrl ?? null,
    createdAt: review.updatedAt ?? review.createdAt,
    images: review.images ?? [],
  };
}

export function prependOwnReviewIfMissing(
  pageReviews: TeamMemberPageReview[],
  clientReview: EntityReviewItem | null | undefined
): TeamMemberPageReview[] {
  if (!clientReview?.id) return pageReviews;

  const existingIndex = pageReviews.findIndex((review) => review.id === clientReview.id);
  if (existingIndex >= 0) {
    const next = [...pageReviews];
    next[existingIndex] = mapEntityReviewToPageReview(clientReview);
    return next;
  }

  return [mapEntityReviewToPageReview(clientReview), ...pageReviews];
}

export type MergedOwnReviewState = {
  reviews: TeamMemberPageReview[];
  hasReviewed: boolean;
  ownReviewIds: Set<string>;
  addedReview: boolean;
};

export function mergePageReviewsWithOwnReview(
  pageReviews: TeamMemberPageReview[],
  ownReviewData: GetEntityReviewsResponse | null,
  clientId?: string | number | null
): MergedOwnReviewState {
  if (!ownReviewData) {
    return {
      reviews: pageReviews,
      hasReviewed: false,
      ownReviewIds: new Set(),
      addedReview: false,
    };
  }

  const reviews = prependOwnReviewIfMissing(pageReviews, ownReviewData.clientReview);
  return {
    reviews,
    hasReviewed: !!ownReviewData.hasReviewed,
    ownReviewIds: buildOwnReviewIds(ownReviewData, clientId),
    addedReview: reviews.length > pageReviews.length,
  };
}

export function bumpStatsTotalForAddedReview(
  statsTotal: number,
  pageReviews: TeamMemberPageReview[],
  addedReview: boolean
): number {
  if (!addedReview) return statsTotal;
  return Math.max(statsTotal + 1, pageReviews.length);
}

/** Used to re-sync paginated review lists after create/update (IDs alone are not enough). */
export function buildPageReviewsSeedSignature(reviews: TeamMemberPageReview[]): string {
  return reviews
    .map(
      (review) =>
        `${review.id}:${review.rating}:${(review.text ?? '').trim()}:${review.authorName ?? ''}:${review.createdAt ?? ''}`
    )
    .join('|');
}
