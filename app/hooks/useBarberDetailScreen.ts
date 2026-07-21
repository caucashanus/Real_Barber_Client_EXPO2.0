import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getEmployeeTodaySlots,
  getTeamMemberPage,
  type EmployeeTodaySlot,
  type TeamMemberMediaItem,
  type TeamMemberPageEmployee,
  type TeamMemberPageReview,
} from '@/api/publicTeamMember';
import { getEntityReviews } from '@/api/reviews';
import { useBarberReviewsPagination } from '@/app/hooks/useBarberReviewsPagination';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { buildOwnReviewIds } from '@/utils/barberDetailHelpers';
import { TEAM_MEMBER_PAGE_CACHE_MS } from '@/constants/teamMemberPage';
import {
  branchesFromShiftCalendar,
  buildBarberReviewParamsFromPage,
  buildReviewStatsFromPage,
  filterValidTodaySlots,
  getPragueTodayDateString,
  getTeamMemberBio,
  getTeamMemberDisplayName,
  getTeamMemberPhone,
  getTodayShiftStatus,
  hasShiftOnDate,
  hasSkillContent,
  isShiftCalendarConfigured,
} from '@/utils/teamMemberPageHelpers';

const pageCache = new Map<string, { expiresAt: number; employee: TeamMemberPageEmployee | null }>();
const EMPTY_PAGE_REVIEWS: TeamMemberPageReview[] = [];

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
  const [todaySlots, setTodaySlots] = useState<EmployeeTodaySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(() => new Set());
  const [fullscreenMedia, setFullscreenMedia] = useState<TeamMemberMediaItem | null>(null);
  const employeeIdRef = useRef<string | null>(null);

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

  const loadTodaySlots = useCallback(async (employeeId: string) => {
    setLoadingSlots(true);
    try {
      const data = await getEmployeeTodaySlots(employeeId, { date: today });
      setTodaySlots(filterValidTodaySlots(data.slots));
    } catch {
      setTodaySlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [today]);

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useEffect(() => {
    if (!employee?.id) {
      employeeIdRef.current = null;
      setTodaySlots([]);
      return;
    }
    if (employeeIdRef.current === employee.id) return;
    employeeIdRef.current = employee.id;
    loadTodaySlots(employee.id).catch(() => {});
  }, [employee?.id, loadTodaySlots]);

  useFocusEffect(
    useCallback(() => {
      if (!employee?.id) return;
      loadTodaySlots(employee.id).catch(() => {});
    }, [employee?.id, loadTodaySlots])
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
    () => employee?.reviews ?? EMPTY_PAGE_REVIEWS,
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
  const hasShiftToday = useMemo(
    () => hasShiftOnDate(employee?.shiftCalendar, today),
    [employee?.shiftCalendar, today]
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
  const showTodaySlotsSection = useMemo(
    () => todaySlots.length > 0 || hasShiftToday,
    [todaySlots.length, hasShiftToday]
  );
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
    todaySlots,
    loadingSlots,
    hasShiftToday,
    todayShiftStatus,
    employeePhone,
    shiftCalendarConfigured,
    today,
    shiftBranches,
    showTodaySlotsSection,
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
