import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Branch } from '@/api/branches';
import {
  getPublicBranchPage,
  mapBranchPageSlotsToNearest,
  mapBranchPageToBranch,
  type BranchPageResponse,
} from '@/api/publicBranchPage';
import type { TeamMemberPageReview } from '@/api/publicTeamMember';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRANCH_PAGE_CACHE_MS } from '@/constants/branchPage';
import { resolveInternalBranchIdFromCrmUuid } from '@/constants/crmBranchIds';
import { usePublicReviewsPagination } from '@/hooks/usePublicReviewsPagination';
import { groupNearestBranchSlots } from '@/utils/nearestBranchHomeSlots';
import {
  fetchMergedPageReviewsWithOwn,
  mapPublicPageReviewToEntityReview,
} from '@/utils/publicReviewHelpers';
import { buildReviewStatsFromPage, getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

const pageCache = new Map<string, { expiresAt: number; data: BranchPageResponse | null }>();

function cacheKey(idOrSlug: string, date: string): string {
  return `${idOrSlug}:${date}`;
}

type LoadPageOptions = {
  background?: boolean;
  skipCache?: boolean;
};

export function useBranchDetailScreen(id: string) {
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [pageReviews, setPageReviews] = useState<TeamMemberPageReview[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsAverage, setStatsAverage] = useState(0);
  const [branchSlots, setBranchSlots] = useState<ReturnType<typeof mapBranchPageSlotsToNearest>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(() => new Set());

  const todayIso = useMemo(() => getPragueTodayDateString(), []);

  const applyBranchPageData = useCallback(
    async (data: BranchPageResponse | null) => {
      const mapped = data ? mapBranchPageToBranch(data) : null;
      const merged = await fetchMergedPageReviewsWithOwn({
        apiToken,
        entityType: 'branch',
        entityId: mapped?.id,
        pageReviews: data?.reviews ?? [],
        statsTotal: data?.stats?.totalReviews ?? 0,
        clientId: client?.id,
      });

      setBranch(mapped);
      setPageReviews(merged.reviews);
      setStatsTotal(merged.statsTotal);
      setStatsAverage(data?.stats?.averageRating ?? 0);
      setBranchSlots(
        mapBranchPageSlotsToNearest(
          data?.nearestSlots,
          mapped?.name ?? '',
          mapped?.address ?? null
        )
      );
      setHasReviewed(merged.hasReviewed);
      setOwnReviewIds(merged.ownReviewIds);
      setError(mapped ? null : 'Branch not found');
    },
    [apiToken, client?.id]
  );

  const loadPage = useCallback(
    async (options?: LoadPageOptions) => {
      if (!id) {
        setLoading(false);
        setError('Branch not found');
        return;
      }

      const key = cacheKey(id, todayIso);
      if (!options?.skipCache) {
        const cached = pageCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          await applyBranchPageData(cached.data);
          setLoading(false);
          return;
        }
      }

      if (!options?.background) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getPublicBranchPage(id, { date: todayIso });
        pageCache.set(key, {
          data,
          expiresAt: Date.now() + BRANCH_PAGE_CACHE_MS,
        });
        await applyBranchPageData(data);
      } catch (e) {
        setBranch(null);
        setPageReviews([]);
        setStatsTotal(0);
        setStatsAverage(0);
        setBranchSlots([]);
        setHasReviewed(false);
        setOwnReviewIds(new Set());
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [applyBranchPageData, id, todayIso]
  );

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      loadPage({ background: true, skipCache: true }).catch(() => {});
    }, [loadPage])
  );

  const reviewsPagination = usePublicReviewsPagination(
    'branch',
    branch?.id,
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

  const reviews = useMemo(
    () =>
      reviewsPagination.visibleReviews.map((review) =>
        mapPublicPageReviewToEntityReview(review, 'branch', branch?.id ?? '')
      ),
    [reviewsPagination.visibleReviews, branch?.id]
  );

  const internalBranchId = useMemo(
    () => (branch?.id ? resolveInternalBranchIdFromCrmUuid(branch.id) : resolveInternalBranchIdFromCrmUuid(id)),
    [branch?.id, id]
  );

  const slotGroups = useMemo(
    () => groupNearestBranchSlots(branchSlots, locale, todayIso),
    [branchSlots, locale, todayIso]
  );

  return {
    branch,
    loading,
    error,
    reviews,
    reviewsPagination,
    hasReviewed,
    ownReviewIds,
    average,
    displayTotal,
    internalBranchId,
    slotGroups,
    loadingSlots: loading && !branch,
    locale,
  };
}
