import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getBarbersRoster, type BarberRosterResponse } from '@/api/barbersRoster';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { TEAM_MEMBER_PAGE_CACHE_MS } from '@/constants/teamMemberPage';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import {
  buildScheduleDayTabs,
  mapRosterToScheduleCardsByDate,
  mapRosterToTeamCards,
} from '@/utils/mapBarberRosterCard';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

const rosterCache = new Map<string, { expiresAt: number; roster: BarberRosterResponse }>();

function rosterCacheKey(date: string, days: number, locale: string): string {
  return `${date}:${days}:${locale}`;
}

export function useBarbersRoster(days = 7) {
  const { apiToken } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const anchorDate = useMemo(() => getPragueTodayDateString(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<BarberRosterResponse | null>(null);
  const lastFetchRef = useRef(0);

  const loadRoster = useCallback(
    async (options?: { force?: boolean }) => {
      const key = rosterCacheKey(anchorDate, days, locale);
      const cached = rosterCache.get(key);
      const isStale = !cached || cached.expiresAt <= Date.now();
      if (!options?.force && !isStale && cached) {
        return cached.roster;
      }

      const data = await getBarbersRoster({
        date: anchorDate,
        days,
        locale,
        apiToken,
      });
      rosterCache.set(key, {
        roster: data,
        expiresAt: Date.now() + TEAM_MEMBER_PAGE_CACHE_MS,
      });
      lastFetchRef.current = Date.now();
      return data;
    },
    [anchorDate, apiToken, days, locale]
  );

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await loadRoster({ force: true });
      setRoster(data);
    } catch (e) {
      setRoster(null);
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [loadRoster]);

  const refreshIfStale = useCallback(async () => {
    if (Date.now() - lastFetchRef.current < TEAM_MEMBER_PAGE_CACHE_MS) return;
    setRefreshing(true);
    try {
      const data = await loadRoster({ force: true });
      setRoster(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setRefreshing(false);
    }
  }, [loadRoster]);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!roster) return;
      refreshIfStale().catch(() => {});
    }, [refreshIfStale, roster])
  );

  const teamCards: HomeTodayTeamCardModel[] = useMemo(() => {
    if (!roster) return [];
    return mapRosterToTeamCards(roster, locale, t);
  }, [locale, roster, t]);

  const scheduleDayTabs = useMemo(() => {
    if (!roster) return [];
    return buildScheduleDayTabs(roster, locale);
  }, [locale, roster]);

  const scheduleCardsByDate = useMemo(() => {
    if (!roster) return {};
    return mapRosterToScheduleCardsByDate(roster, locale, t);
  }, [locale, roster, t]);

  const todayIso = roster?.meta.date ?? anchorDate;

  return {
    roster,
    teamCards,
    scheduleDayTabs,
    scheduleCardsByDate,
    todayIso,
    loading,
    refreshing,
    error,
    refresh,
  };
}
