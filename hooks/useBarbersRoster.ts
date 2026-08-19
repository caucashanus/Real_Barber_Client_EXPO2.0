import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getBarbersRoster, type BarberRosterResponse } from '@/api/barbersRoster';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ackListingFetch,
  shouldRefetchListing,
} from '@/lib/availability/listingCache';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import {
  buildScheduleDayTabs,
  mapRosterToScheduleCardsByDate,
  mapRosterToTeamCards,
} from '@/utils/mapBarberRosterCard';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

const rosterCache = new Map<string, { fetchedAt: number; roster: BarberRosterResponse }>();

function rosterCacheKey(date: string, days: number, locale: string): string {
  return `roster:${date}:${days}:${locale}`;
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
  const lastFetchedAtRef = useRef(0);
  const listingKey = rosterCacheKey(anchorDate, days, locale);

  const loadRoster = useCallback(
    async (options?: { force?: boolean }) => {
      const cached = rosterCache.get(listingKey);
      const cachedAt = cached?.fetchedAt ?? lastFetchedAtRef.current;
      if (!options?.force && cached && !shouldRefetchListing(listingKey, cachedAt)) {
        return cached.roster;
      }

      const data = await getBarbersRoster({
        date: anchorDate,
        days,
        locale,
        apiToken,
      });
      rosterCache.set(listingKey, {
        roster: data,
        fetchedAt: Date.now(),
      });
      lastFetchedAtRef.current = Date.now();
      ackListingFetch(listingKey);
      return data;
    },
    [anchorDate, apiToken, days, listingKey, locale]
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

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!roster) return;
      loadRoster()
        .then((data) => {
          setRoster(data);
          setError(null);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Failed to load');
        });
    }, [loadRoster, roster])
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
