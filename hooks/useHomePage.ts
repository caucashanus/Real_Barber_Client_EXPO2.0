import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getHome } from '@/api/home';
import type { Booking } from '@/api/bookings';
import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import type { HomepageNextSlot, HomepageTodayTeamMember } from '@/api/homeTeamTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildHomeTodayTeamCards,
  mergeTodayTeamWithAvailability,
  type HomeTodayTeamCardModel,
} from '@/utils/homeTodayTeamHelpers';
import { shouldStaleRefresh } from '@/utils/staleRefresh';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

const HOME_STALE_MS = 60_000;

type MergedTodayTeamMember = HomepageTodayTeamMember & { nextSlots: HomepageNextSlot[] };

export function useHomePage() {
  const { apiToken } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const today = useMemo(() => getPragueTodayDateString(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<ClientCoupon[]>([]);
  const [posters, setPosters] = useState<ClientPoster[]>([]);
  const [members, setMembers] = useState<MergedTodayTeamMember[]>([]);
  const lastFetchedAtRef = useRef(0);
  const inflightRef = useRef<Promise<void> | null>(null);

  const applyHomeData = useCallback(
    (data: Awaited<ReturnType<typeof getHome>>) => {
      const team = data.todayTeam ?? [];
      setMembers(mergeTodayTeamWithAvailability(team, data.availability));
      setBookings(data.bookings ?? []);
      setCoupons(data.coupons ?? []);
      setPosters(data.posters ?? []);
      lastFetchedAtRef.current = Date.now();
    },
    []
  );

  const loadHome = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      const isStale = shouldStaleRefresh(lastFetchedAtRef.current, {
        force: options?.force,
        staleMs: HOME_STALE_MS,
      });
      if (!isStale) return;

      if (inflightRef.current) return inflightRef.current;

      if (!options?.silent) {
        setError(null);
      }

      inflightRef.current = (async () => {
        try {
          const data = await getHome({ date: today, locale, apiToken });
          applyHomeData(data);
        } catch (e) {
          if (options?.force && lastFetchedAtRef.current === 0) {
            setMembers([]);
            setBookings([]);
            setCoupons([]);
            setPosters([]);
          }
          if (!options?.silent) {
            setError(e instanceof Error ? e.message : 'Failed to load');
          }
        } finally {
          inflightRef.current = null;
        }
      })();

      return inflightRef.current;
    },
    [apiToken, applyHomeData, locale, today]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHome({ force: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadHome]);

  useEffect(() => {
    setLoading(true);
    loadHome({ force: true })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadHome]);

  useFocusEffect(
    useCallback(() => {
      loadHome().catch(() => {});
    }, [loadHome])
  );

  const cards: HomeTodayTeamCardModel[] = useMemo(
    () => buildHomeTodayTeamCards({ members, locale, t }),
    [locale, members, t]
  );

  return {
    cards,
    bookings,
    coupons,
    posters,
    loading,
    refreshing,
    error,
    refresh,
  };
}
