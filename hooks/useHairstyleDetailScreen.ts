import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPublicHairstylePage } from '@/api/publicHairstylePage';
import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import { getEntityReviewsForService } from '@/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePublicReviewsPagination } from '@/hooks/usePublicReviewsPagination';
import {
  buildHairstyleReviewParams,
  mapHairstyleToServiceDetail,
  type HairstyleServiceDetail,
} from '@/utils/inspiraceServiceDetailHelpers';
import {
  groupNearestBranchSlots,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import {
  bumpStatsTotalForAddedReview,
  mergePageReviewsWithOwnReview,
} from '@/utils/publicReviewHelpers';
import { buildReviewStatsFromPage, getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

type LoadPageOptions = {
  background?: boolean;
  bustCache?: boolean;
};

export function useHairstyleDetailScreen(idOrSlug: string) {
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();

  const [detail, setDetail] = useState<HairstyleServiceDetail | null>(null);
  const [pageReviews, setPageReviews] = useState<TeamMemberPageReview[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsAverage, setStatsAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(() => new Set());

  const todayIso = useMemo(() => getPragueTodayDateString(), []);

  const loadPage = useCallback(
    async (options?: LoadPageOptions) => {
      if (!idOrSlug) {
        setLoading(false);
        return;
      }

      if (!options?.background) {
        setLoading(true);
      }
      setError(null);

      try {
        const hairstyle = await fetchPublicHairstylePage(idOrSlug, {
          bustCache: options?.bustCache,
        });
        if (!hairstyle) {
          setDetail(null);
          setPageReviews([]);
          setStatsTotal(0);
          setStatsAverage(0);
          setHasReviewed(false);
          setOwnReviewIds(new Set());
          setError('not-found');
          return;
        }

        let reviews = hairstyle.reviews ?? [];
        let totalReviews = hairstyle.stats?.totalReviews ?? 0;
        let nextHasReviewed = false;
        let nextOwnReviewIds = new Set<string>();

        if (apiToken) {
          try {
            const ownData = await getEntityReviewsForService(apiToken, hairstyle.id, {
              page: 1,
              limit: 100,
              includeOwn: true,
            });
            const merged = mergePageReviewsWithOwnReview(reviews, ownData, client?.id);
            reviews = merged.reviews;
            nextHasReviewed = merged.hasReviewed;
            nextOwnReviewIds = merged.ownReviewIds;
            totalReviews = bumpStatsTotalForAddedReview(
              totalReviews,
              reviews,
              merged.addedReview
            );
          } catch {
            // Public page reviews still render when own-review fetch fails.
          }
        }

        setDetail(mapHairstyleToServiceDetail(hairstyle, locale));
        setPageReviews(reviews);
        setStatsTotal(totalReviews);
        setStatsAverage(hairstyle.stats?.averageRating ?? 0);
        setHasReviewed(nextHasReviewed);
        setOwnReviewIds(nextOwnReviewIds);
      } catch {
        setDetail(null);
        setPageReviews([]);
        setStatsTotal(0);
        setStatsAverage(0);
        setHasReviewed(false);
        setOwnReviewIds(new Set());
        setError('load-error');
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [apiToken, client?.id, idOrSlug, locale]
  );

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      loadPage({ background: true, bustCache: true }).catch(() => {});
    }, [loadPage])
  );

  const reviewsPagination = usePublicReviewsPagination(
    'service',
    detail?.id,
    pageReviews,
    statsTotal
  );

  const pageReviewStats = useMemo(
    () => buildReviewStatsFromPage(pageReviews),
    [pageReviews]
  );
  const countByRating = pageReviewStats.countByRating;
  const average = statsTotal > 0 ? statsAverage : pageReviewStats.average;
  const displayTotal = statsTotal > 0 ? statsTotal : pageReviewStats.total;

  const reviews = reviewsPagination.visibleReviews;

  const slotGroups = useMemo(() => {
    if (!detail?.nearestSlots.length) return [];
    return groupNearestBranchSlots(detail.nearestSlots, locale, todayIso);
  }, [detail?.nearestSlots, locale, todayIso]);

  const reviewParams = detail
    ? buildHairstyleReviewParams(detail.id, detail.title, detail.heroSlides[0]?.src)
    : '';

  return {
    detail,
    loading,
    error,
    reviews,
    reviewsPagination,
    hasReviewed,
    ownReviewIds,
    reviewParams,
    average,
    countByRating,
    displayTotal,
    slotGroups,
    locale,
    todayIso,
  };
}

export type { NearestBranchHomeSlot };
