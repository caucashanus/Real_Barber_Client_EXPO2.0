import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getTeamMemberPage,
  type TeamMemberMediaItem,
  type TeamMemberPageEmployee,
  type TeamMemberPageReview,
} from '@/api/publicTeamMember';
import { getEntityReviews } from '@/api/reviews';
import { useBarberReviewsPagination } from '@/hooks/useBarberReviewsPagination';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildOwnReviewIds } from '@/utils/barberDetailHelpers';
import { TEAM_MEMBER_PAGE_CACHE_MS } from '@/constants/teamMemberPage';
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

const pageCache = new Map<string, { expiresAt: number; employee: TeamMemberPageEmployee | null }>();

function cacheKey(idOrSlug: string, date: string): string {
  return `${idOrSlug}:${date}`;
}

export function useBarberDetailScreen(idOrSlug: string) {
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();
  const today = useMemo(() => getPragueTodayDateString(), []);

  const [employee, setEmployee] = useState<TeamMemberPageEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(() => new Set());
  const [fullscreenMedia, setFullscreenMedia] = useState<TeamMemberMediaItem | null>(null);

  const loadPage = useCallback(async () => {
    if (!idOrSlug) {
      setLoading(false);
      setError('Barber not found');
      return;
    }

    const key = cacheKey(idOrSlug, today);
    const cached = pageCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      setEmployee(cached.employee);
      setError(cached.employee ? null : 'Barber not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getTeamMemberPage(idOrSlug, { date: today });
      const nextEmployee = data.employee ?? null;
      pageCache.set(key, {
        employee: nextEmployee,
        expiresAt: Date.now() + TEAM_MEMBER_PAGE_CACHE_MS,
      });
      setEmployee(nextEmployee);
      if (!nextEmployee) setError('Barber not found');
    } catch (e) {
      setEmployee(null);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [idOrSlug, today]);

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      loadPage().catch(() => {});
    }, [loadPage])
  );

  const loadOwnReviewState = useCallback(() => {
    if (!apiToken || !employee?.id) {
      setHasReviewed(false);
      setOwnReviewIds(new Set());
      return;
    }
    getEntityReviews(apiToken, 'employee', employee.id, { page: 1, limit: 100, includeOwn: true })
      .then((data) => {
        setHasReviewed(!!data.hasReviewed);
        setOwnReviewIds(buildOwnReviewIds(data, client?.id));
      })
      .catch(() => {
        setHasReviewed(false);
        setOwnReviewIds(new Set());
      });
  }, [apiToken, client?.id, employee?.id]);

  useEffect(() => {
    loadOwnReviewState();
  }, [loadOwnReviewState]);

  useFocusEffect(
    useCallback(() => {
      loadOwnReviewState();
    }, [loadOwnReviewState])
  );

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
  const statsAverage = employee?.stats?.averageRating ?? 0;
  const statsTotal = employee?.stats?.totalReviews ?? 0;
  const pageReviews = useMemo(
    () => employee?.reviews ?? ([] as TeamMemberPageReview[]),
    [employee?.reviews]
  );
  const pageReviewStats = useMemo(() => buildReviewStatsFromPage(pageReviews), [pageReviews]);
  const countByRating = pageReviewStats.countByRating;
  const average = statsTotal > 0 ? statsAverage : pageReviewStats.average;
  const displayTotal = statsTotal > 0 ? statsTotal : pageReviewStats.total;

  const reviewsPagination = useBarberReviewsPagination(
    employee?.id,
    pageReviews,
    statsTotal
  );
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
