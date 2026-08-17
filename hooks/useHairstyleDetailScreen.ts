import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPublicHairstylePage } from '@/api/publicHairstylePage';
import type { TeamMemberPageReview } from '@/api/publicTeamMember';
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
import { fetchMergedPageReviewsWithOwn } from '@/utils/publicReviewHelpers';
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

        const merged = await fetchMergedPageReviewsWithOwn({
          apiToken,
          entityType: 'service',
          entityId: hairstyle.id,
          pageReviews: hairstyle.reviews ?? [],
          statsTotal: hairstyle.stats?.totalReviews ?? 0,
          clientId: client?.id,
        });

        setDetail(mapHairstyleToServiceDetail(hairstyle, locale));
        setPageReviews(merged.reviews);
        setStatsTotal(merged.statsTotal);
        setStatsAverage(hairstyle.stats?.averageRating ?? 0);
        setHasReviewed(merged.hasReviewed);
        setOwnReviewIds(merged.ownReviewIds);
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
