import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getHomepagePage,
  getHomepageTodayTeamAvailability,
  type HomepageNextSlot,
  type HomepageTodayTeamMember,
} from '@/api/publicHomepage';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { HOMEPAGE_SHELL_CACHE_MS } from '@/constants/homepage';
import {
  buildHomeTodayTeamCards,
  mergeTodayTeamWithAvailability,
  type HomeTodayTeamCardModel,
} from '@/utils/homeTodayTeamHelpers';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

type MergedTodayTeamMember = HomepageTodayTeamMember & { nextSlots: HomepageNextSlot[] };

const shellCache = new Map<
  string,
  { expiresAt: number; todayTeam: HomepageTodayTeamMember[] }
>();

function shellCacheKey(date: string, locale: string): string {
  return `${date}:${locale}`;
}

export function useHomeTodayTeam() {
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const today = useMemo(() => getPragueTodayDateString(), []);

  const [loading, setLoading] = useState(true);
  const [refreshingAvailability, setRefreshingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MergedTodayTeamMember[]>([]);
  const shellTeamRef = useRef<HomepageTodayTeamMember[]>([]);

  const loadShell = useCallback(async () => {
    const key = shellCacheKey(today, locale);
    const cached = shellCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.todayTeam;
    }

    const data = await getHomepagePage({ date: today, locale });
    const team = data.todayTeam ?? [];
    shellCache.set(key, {
      todayTeam: team,
      expiresAt: Date.now() + HOMEPAGE_SHELL_CACHE_MS,
    });
    return team;
  }, [locale, today]);

  const loadAvailability = useCallback(
    async (team: HomepageTodayTeamMember[]) => {
      if (team.length === 0) return [] as MergedTodayTeamMember[];
      const data = await getHomepageTodayTeamAvailability({ date: today, locale });
      return mergeTodayTeamWithAvailability(team, data.availability);
    },
    [locale, today]
  );

  const refreshAvailability = useCallback(
    async (team: HomepageTodayTeamMember[]) => {
      if (team.length === 0) return;
      setRefreshingAvailability(true);
      try {
        const merged = await loadAvailability(team);
        setMembers(merged);
        shellTeamRef.current = team;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setRefreshingAvailability(false);
      }
    },
    [loadAvailability]
  );

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const team = await loadShell();
      const merged = await loadAvailability(team);
      setMembers(merged);
      shellTeamRef.current = team;
    } catch (e) {
      setMembers([]);
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [loadAvailability, loadShell]);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (shellTeamRef.current.length === 0) return;
      refreshAvailability(shellTeamRef.current).catch(() => {});
    }, [refreshAvailability])
  );

  const cards: HomeTodayTeamCardModel[] = useMemo(
    () => buildHomeTodayTeamCards({ members, locale, t }),
    [locale, members, t]
  );

  return {
    cards,
    loading,
    refreshingAvailability,
    error,
    refresh,
  };
}
