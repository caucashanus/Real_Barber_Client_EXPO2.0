import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPublicHairstylePage } from '@/api/publicHairstylePage';
import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePublicReviewsPagination } from '@/hooks/usePublicReviewsPagination';
import {
  ackListingFetch,
  shouldRefetchListing,
} from '@/lib/availability/listingCache';
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

const pageCache = new Map<
  string,
  {
    fetchedAt: number;
    detail: HairstyleServiceDetail | null;
    pageReviews: TeamMemberPageReview[];
    statsTotal: number;
    statsAverage: number;
    hasReviewed: boolean;
    ownReviewIds: Set<string>;
    error: string | null;
  }
>();

type LoadPageOptions = {
  background?: boolean;
  force?: boolean;
};

export function useHairstyleDetailScreen(idOrSlug: string) {
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();

  const [detail, setDetail] = useState<HairstyleServiceDetail | null>(null);
  const [pageReviews, setPageReviews] = useState<TeamMemberPageReview[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsAverage, setStatsAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(() => new Set());

  const todayIso = useMemo(() => getPragueTodayDateString(), []);
  const listingKey = useMemo(() => `service:${idOrSlug}:${todayIso}`, [idOrSlug, todayIso]);

  const applyCached = useCallback((cached: NonNullable<ReturnType<typeof pageCache.get>>) => {
    setDetail(cached.detail);
    setPageReviews(cached.pageReviews);
    setStatsTotal(cached.statsTotal);
    setStatsAverage(cached.statsAverage);
    setHasReviewed(cached.hasReviewed);
    setOwnReviewIds(cached.ownReviewIds);
    setError(cached.error);
  }, []);

  const loadPage = useCallback(
    async (options?: LoadPageOptions) => {
      if (!idOrSlug) {
        setLoading(false);
        return;
      }

      const cached = pageCache.get(listingKey);
      const cachedAt = cached?.fetchedAt ?? 0;
      if (!options?.force && cached && !shouldRefetchListing(listingKey, cachedAt)) {
        applyCached(cached);
        setLoading(false);
        return;
      }

      if (!options?.background) {
        setLoading(true);
      }
      setError(null);

      try {
        const hairstyle = await fetchPublicHairstylePage(idOrSlug, {
          bustCache: options?.force,
        });
        if (!hairstyle) {
          const empty = {
            fetchedAt: Date.now(),
            detail: null,
            pageReviews: [] as TeamMemberPageReview[],
            statsTotal: 0,
            statsAverage: 0,
            hasReviewed: false,
            ownReviewIds: new Set<string>(),
            error: 'not-found',
          };
          pageCache.set(listingKey, empty);
          ackListingFetch(listingKey);
          applyCached(empty);
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

        const next = {
          fetchedAt: Date.now(),
          detail: mapHairstyleToServiceDetail(hairstyle, locale),
          pageReviews: merged.reviews,
          statsTotal: merged.statsTotal,
          statsAverage: hairstyle.stats?.averageRating ?? 0,
          hasReviewed: merged.hasReviewed,
          ownReviewIds: merged.ownReviewIds,
          error: null,
        };
        pageCache.set(listingKey, next);
        ackListingFetch(listingKey);
        applyCached(next);
      } catch {
        if (!options?.background) {
          setDetail(null);
          setPageReviews([]);
          setStatsTotal(0);
          setStatsAverage(0);
          setHasReviewed(false);
          setOwnReviewIds(new Set());
          setError('load-error');
        }
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [apiToken, applyCached, client?.id, idOrSlug, listingKey, locale]
  );

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      loadPage({ background: true }).catch(() => {});
    }, [loadPage])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage({ force: true, background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

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
    refreshing,
    refresh,
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
