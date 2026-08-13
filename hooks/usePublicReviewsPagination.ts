import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getPublicEntityReviews,
  type TeamMemberPageReview,
} from '@/api/publicTeamMember';
import { TEAM_MEMBER_PAGE_REVIEWS_LIMIT } from '@/constants/teamMemberPage';
import { buildPageReviewsSeedSignature } from '@/utils/publicReviewHelpers';

export const REVIEWS_PAGE_SIZE = TEAM_MEMBER_PAGE_REVIEWS_LIMIT;

function mergeUniqueReviews(
  existing: TeamMemberPageReview[],
  incoming: TeamMemberPageReview[]
): TeamMemberPageReview[] {
  if (incoming.length === 0) return existing;
  const incomingById = new Map(incoming.map((review) => [review.id, review]));
  const merged = existing.map((review) => incomingById.get(review.id) ?? review);
  const seen = new Set(existing.map((review) => review.id));
  for (const review of incoming) {
    if (seen.has(review.id)) continue;
    seen.add(review.id);
    merged.push(review);
  }
  return merged;
}

export function usePublicReviewsPagination(
  entityType: 'employee' | 'branch' | 'service',
  entityId: string | undefined,
  initialReviews: TeamMemberPageReview[],
  statsTotalReviews: number
) {
  const [allReviews, setAllReviews] = useState(initialReviews);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seedKey = `${entityType}:${entityId ?? ''}:${buildPageReviewsSeedSignature(initialReviews)}`;

  useEffect(() => {
    setAllReviews(initialReviews);
    setPage(1);
    setError(null);
    setLoading(false);
  }, [seedKey]);

  const totalReviews = Math.max(statsTotalReviews, allReviews.length);
  const totalPages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PAGE_SIZE));
  const showPagination = totalReviews > REVIEWS_PAGE_SIZE;
  const allLoaded = allReviews.length >= totalReviews;
  const isOnLastPage = page >= totalPages;

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * REVIEWS_PAGE_SIZE;
    return allReviews.slice(start, start + REVIEWS_PAGE_SIZE);
  }, [allReviews, page]);

  const canGoPrevious = page > 1 && !loading;
  const canGoNext = !loading && !(isOnLastPage && allLoaded);

  const goPrevious = useCallback(() => {
    if (!canGoPrevious) return;
    setPage((current) => Math.max(1, current - 1));
    setError(null);
  }, [canGoPrevious]);

  const goNext = useCallback(async () => {
    if (!entityId || !canGoNext) return;

    const targetPage = page + 1;
    const requiredCount = targetPage * REVIEWS_PAGE_SIZE;

    setLoading(true);
    setError(null);

    try {
      let merged = allReviews;
      while (merged.length < requiredCount && merged.length < totalReviews) {
        const data = await getPublicEntityReviews(entityType, entityId, {
          limit: REVIEWS_PAGE_SIZE,
          offset: merged.length,
        });
        const batch = data.reviews ?? [];
        if (batch.length === 0) break;
        merged = mergeUniqueReviews(merged, batch);
      }

      const pageStart = (targetPage - 1) * REVIEWS_PAGE_SIZE;
      if (merged.length <= pageStart) {
        throw new Error('Failed to load reviews');
      }

      setAllReviews(merged);
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [allReviews, canGoNext, entityId, entityType, page, totalReviews]);

  return {
    visibleReviews,
    showPagination,
    loading,
    error,
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
  };
}

/** @deprecated Use usePublicReviewsPagination with entityType 'employee'. */
export function useBarberReviewsPagination(
  employeeId: string | undefined,
  initialReviews: TeamMemberPageReview[],
  statsTotalReviews: number
) {
  return usePublicReviewsPagination('employee', employeeId, initialReviews, statsTotalReviews);
}
