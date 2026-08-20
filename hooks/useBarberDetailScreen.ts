import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getTeamMemberPage,
  type TeamMemberMediaItem,
  type TeamMemberPageEmployee,
  type TeamMemberPageReview,
  type TeamMemberPageResponse,
} from '@/api/publicTeamMember';
import { useBarberReviewsPagination } from '@/hooks/useBarberReviewsPagination';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ackListingFetch,
  shouldRefetchListing,
} from '@/lib/availability/listingCache';
import { fetchMergedPageReviewsWithOwn } from '@/utils/publicReviewHelpers';
import {
  branchesFromShiftCalendar,
  buildBarberNearestSlotDayGroups,
  buildBarberReviewParamsFromPage,
  buildReviewStatsFromPage,
  getPragueTodayDateString,
  getTeamMemberBio,
  getTeamMemberDisplayName,
  getTeamMemberPhone,
  getTodayShiftStatus,
  hasSkillContent,
  isShiftCalendarConfigured,
} from '@/utils/teamMemberPageHelpers';

const pageCache = new Map<string, { fetchedAt: number; data: TeamMemberPageResponse | null }>();

function cacheKey(idOrSlug: string, date: string): string {
  return `employee:${idOrSlug}:${date}`;
}

type LoadPageOptions = {
  background?: boolean;
  skipCache?: boolean;
};

export function useBarberDetailScreen(idOrSlug: string) {
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();
  const today = useMemo(() => getPragueTodayDateString(), []);

  const [employee, setEmployee] = useState<TeamMemberPageEmployee | null>(null);
  const [pageReviews, setPageReviews] = useState<TeamMemberPageReview[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsAverage, setStatsAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(() => new Set());
  const [fullscreenMedia, setFullscreenMedia] = useState<TeamMemberMediaItem | null>(null);

  const applyEmployeePageData = useCallback(
    async (data: TeamMemberPageResponse | null) => {
      const nextEmployee = data?.employee ?? null;
      const baseReviews = nextEmployee?.reviews ?? [];
      const baseTotal = nextEmployee?.stats?.totalReviews ?? 0;

      const merged = await fetchMergedPageReviewsWithOwn({
        apiToken,
        entityType: 'employee',
        entityId: nextEmployee?.id,
        pageReviews: baseReviews,
        statsTotal: baseTotal,
        clientId: client?.id,
      });

      setEmployee(nextEmployee);
      setPageReviews(merged.reviews);
      setStatsTotal(merged.statsTotal);
      setStatsAverage(nextEmployee?.stats?.averageRating ?? 0);
      setHasReviewed(merged.hasReviewed);
      setOwnReviewIds(merged.ownReviewIds);
      setError(nextEmployee ? null : 'Barber not found');
    },
    [apiToken, client?.id]
  );

  const loadPage = useCallback(
    async (options?: LoadPageOptions) => {
      if (!idOrSlug) {
        setLoading(false);
        setError('Barber not found');
        return;
      }

      const key = cacheKey(idOrSlug, today);
      const cached = pageCache.get(key);
      const cachedAt = cached?.fetchedAt ?? 0;
      if (!options?.skipCache && cached && !shouldRefetchListing(key, cachedAt)) {
        await applyEmployeePageData(cached.data);
        setLoading(false);
        return;
      }

      if (!options?.background) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getTeamMemberPage(idOrSlug, { date: today });
        pageCache.set(key, {
          data,
          fetchedAt: Date.now(),
        });
        ackListingFetch(key);
        await applyEmployeePageData(data);
      } catch (e) {
        if (!options?.background) {
          setEmployee(null);
          setPageReviews([]);
          setStatsTotal(0);
          setStatsAverage(0);
          setHasReviewed(false);
          setOwnReviewIds(new Set());
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [applyEmployeePageData, idOrSlug, today]
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
      await loadPage({ skipCache: true, background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const displayName = useMemo(
    () => (employee ? getTeamMemberDisplayName(employee, locale) : ''),
    [employee, locale]
  );
  const bio = useMemo(
    () => (employee ? getTeamMemberBio(employee, locale) : null),
    [employee, locale]
  );
  const shiftBranches = useMemo(
    () => (employee ? branchesFromShiftCalendar(employee, employee.shiftCalendar) : []),
    [employee]
  );
  const pageReviewStats = useMemo(() => buildReviewStatsFromPage(pageReviews), [pageReviews]);
  const countByRating = pageReviewStats.countByRating;
  const average = statsTotal > 0 ? statsAverage : pageReviewStats.average;
  const displayTotal = statsTotal > 0 ? statsTotal : pageReviewStats.total;

  const reviewsPagination = useBarberReviewsPagination(employee?.id, pageReviews, statsTotal);
  const todayShiftStatus = useMemo(
    () => getTodayShiftStatus(employee?.shiftCalendar, today),
    [employee?.shiftCalendar, today]
  );
  const employeePhone = useMemo(
    () => (employee ? getTeamMemberPhone(employee) : null),
    [employee]
  );
  const shiftCalendarConfigured = useMemo(
    () => isShiftCalendarConfigured(employee?.shiftCalendar),
    [employee?.shiftCalendar]
  );
  const nearestSlotDayGroups = useMemo(
    () =>
      buildBarberNearestSlotDayGroups({
        nearestSlots: employee?.nearestSlots,
        shiftCalendar: employee?.shiftCalendar,
        today,
        locale,
      }),
    [employee?.nearestSlots, employee?.shiftCalendar, today, locale]
  );
  const showNearestSlotsSection = nearestSlotDayGroups.length > 0;
  const reviewParams = employee ? buildBarberReviewParamsFromPage(employee) : '';
  const showSkills = employee ? hasSkillContent(employee) : false;
  const showAbout = Boolean(bio?.trim());
  const showMedia = (employee?.media?.length ?? 0) > 0;
  const showStoriesGallery = (employee?.stories?.length ?? 0) > 0;

  return {
    employee,
    loading,
    refreshing,
    refresh,
    error,
    displayName,
    bio,
    nearestSlotDayGroups,
    todayShiftStatus,
    employeePhone,
    shiftCalendarConfigured,
    today,
    shiftBranches,
    showNearestSlotsSection,
    showAbout,
    showSkills,
    showMedia,
    showStoriesGallery,
    reviews: reviewsPagination.visibleReviews,
    reviewsPagination,
    hasReviewed,
    ownReviewIds,
    reviewParams,
    countByRating,
    average,
    displayTotal,
    locale,
    clientId: client?.id,
    fullscreenMedia,
    setFullscreenMedia,
  };
}
