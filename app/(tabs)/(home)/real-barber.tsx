import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';

import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import { getOffersCoupons, getOffersPosters } from '@/api/offers';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBookings } from '@/app/contexts/BookingsBadgeContext';
import { useHomeTodayTeam } from '@/app/hooks/useHomeTodayTeam';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { HomePromoCarousel } from '@/components/HomePromoCarousel';
import { HomeRepeatBookingCard } from '@/components/HomeRepeatBookingCard';
import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import Icon from '@/components/Icon';
import NotificationPromptSheet from '@/components/NotificationPromptSheet';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { getBookingEndDate, isBookingPast } from '@/utils/bookingHelpers';
import { pickRepeatBookingCandidate } from '@/utils/repeatBooking';
import { buildHomePromoCouponCarouselList, homePromoClientSeed } from '@/utils/homePromoCoupon';
import {
  mergePostersAndCouponsRoundRobin,
  filterHomePosters,
} from '@/utils/homePromoFeed';
import { pickHomeSpotlight, formatHomeBookingSlotLabel } from '@/utils/homeSpotlight';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

/** Šířka obsahu v ThemeScroller — `px-global` (24 px × 2). */
const HOME_LAYOUT_HORIZONTAL_PADDING = 48;

function getHomePromoCarouselSize(screenWidth: number) {
  const width = screenWidth - HOME_LAYOUT_HORIZONTAL_PADDING;
  return {
    width,
    /** 3:2 aspect — web parity (height = width × 2/3). */
    height: Math.round(width * (2 / 3)),
  };
}

/** Kupóny skryté v sekci Tipy a nabídky i když je API vrátí (filtrování podle `name`). */
const HIDDEN_HOME_PROMO_COUPON_NAMES = new Set(['Gorila10', 'TVPRIMA10']);

/** Ikony dlaždic rychlých akcí na home. */
const HOME_ACTION_IMAGES = {
  create: require('@/assets/img/plus-ikon.png'),
  branches: require('@/assets/img/search-modal-branches.png'),
  barbers: require('@/assets/img/barbers.png'),
  bookings: require('@/assets/img/search-modal-bookings.png'),
} as const;

export default function RealBarberHomeTab() {
  const { width: screenWidth } = useWindowDimensions();
  const homePromoCarouselSize = useMemo(
    () => getHomePromoCarouselSize(screenWidth),
    [screenWidth]
  );
  const { apiToken, client } = useAuth();
  const { accentColor } = useAccentColor();
  const { t, locale } = useTranslation();
  const actions = useMemo(
    () => [
      {
        id: 'create' as const,
        title: t('homeCreateBooking'),
        onPress: async () => {
          const suppressed = await isReservationIntroCooldownActive();
          router.push(
            suppressed ? '/screens/reservation-create' : '/screens/reservation-create-start'
          );
        },
      },
      {
        id: 'branches' as const,
        title: t('homeBranches'),
        onPress: () => router.push('/branches' as any),
      },
      {
        id: 'barbers' as const,
        title: t('homeBarbers'),
        onPress: () => router.push('/experience' as any),
      },
      {
        id: 'bookings' as const,
        title: t('homeBookings'),
        onPress: () => router.push('/bookings' as any),
      },
    ],
    [t]
  );

  const {
    bookings: allBookings,
    loading: bookingsLoading,
    refresh: refreshBookings,
    refreshIfStale: refreshBookingsIfStale,
  } = useBookings();
  const {
    cards: todayTeamCards,
    loading: todayTeamLoading,
    refreshingAvailability: todayTeamRefreshingAvailability,
    error: todayTeamError,
    refresh: refreshTodayTeam,
  } = useHomeTodayTeam();
  const [promoLoading, setPromoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [coupons, setCoupons] = useState<ClientCoupon[]>([]);
  const [posters, setPosters] = useState<ClientPoster[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPromoFetchRef = useRef(0);
  const recentLoading = promoLoading || bookingsLoading;

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadPromoData = useCallback(async () => {
    if (!apiToken) {
      setCoupons([]);
      setPosters([]);
      return;
    }
    await Promise.allSettled([
      getOffersCoupons(apiToken)
        .then((list) => setCoupons(list))
        .catch(() => setCoupons([])),
      getOffersPosters(apiToken)
        .then((list) => setPosters(list))
        .catch(() => setPosters([])),
    ]);
    lastPromoFetchRef.current = Date.now();
  }, [apiToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refreshBookings({ force: true }),
      loadPromoData(),
      refreshTodayTeam(),
    ]);
    setRefreshing(false);
  }, [refreshBookings, loadPromoData, refreshTodayTeam]);

  useEffect(() => {
    setPromoLoading(true);
    loadPromoData().finally(() => setPromoLoading(false));
  }, [loadPromoData]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      refreshBookingsIfStale();
      if (Date.now() - lastPromoFetchRef.current >= 60_000) {
        loadPromoData().catch(() => {});
      }
    }, [apiToken, refreshBookingsIfStale, loadPromoData])
  );

  const spotlight = useMemo(() => pickHomeSpotlight(allBookings, now), [allBookings, now]);

  const repeatBooking = useMemo(
    () => pickRepeatBookingCandidate(allBookings, now),
    [allBookings, now]
  );

  const recentBookings = useMemo(
    () =>
      allBookings
        .filter(isBookingPast)
        .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
        .slice(0, 3),
    [allBookings]
  );

  const homePromoCoupons = useMemo(
    () => coupons.filter((c) => !HIDDEN_HOME_PROMO_COUPON_NAMES.has(c.name.trim())),
    [coupons]
  );

  const clientPromoSeed = useMemo(
    () => homePromoClientSeed(client?.id ?? apiToken ?? ''),
    [client?.id, apiToken]
  );

  const homePromoCouponsForMerge = useMemo(
    () =>
      buildHomePromoCouponCarouselList(homePromoCoupons, {
        nowMs: now,
        clientSeed: clientPromoSeed,
      }),
    [homePromoCoupons, now, clientPromoSeed]
  );

  const homePromoFeed = useMemo(
    () => mergePostersAndCouponsRoundRobin(filterHomePosters(posters), homePromoCouponsForMerge),
    [posters, homePromoCouponsForMerge]
  );

  return (
    <>
      <ThemeScroller
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }>
        <NotificationPromptSheet />
        {apiToken ? (
          <View className="mt-4">
            <HomePromoCarousel
              feed={homePromoFeed}
              width={homePromoCarouselSize.width}
              height={homePromoCarouselSize.height}
              loading={recentLoading}
              locale={locale}
              t={t}
            />
          </View>
        ) : null}
        {!recentLoading && repeatBooking ? (
          <View className={apiToken ? 'mt-0' : 'mt-4'}>
            <HomeRepeatBookingCard booking={repeatBooking} t={t} />
          </View>
        ) : null}

        {!recentLoading && spotlight ? (
          <View className="mt-4">
            <HomeSpotlightCard spotlight={spotlight} t={t} locale={locale} />
          </View>
        ) : null}

        <View className="mt-6 flex-row flex-wrap justify-between">
          {actions.map((a) => (
            <Pressable
              key={a.id}
              onPress={a.onPress}
              className="mb-2 w-[48.7%] rounded-2xl bg-light-secondary dark:bg-dark-secondary active:opacity-70">
              <View className="flex-row items-center gap-3 p-3.5">
                <Image
                  source={HOME_ACTION_IMAGES[a.id]}
                  style={{ width: 28, height: 28 }}
                  contentFit="contain"
                />
                <ThemedText
                  className="min-w-0 flex-1 text-sm font-semibold leading-tight"
                  numberOfLines={2}>
                  {a.title}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>

        {!recentLoading && recentBookings.length > 0 ? (
          <Section title={t('homeRecentTitle')} titleSize="lg" className="mt-6">
            <View className="mt-2">
              {recentBookings.map((b, i) => (
                <Pressable
                  key={b.id}
                  onPress={() =>
                    router.push(`/screens/booking-detail?id=${encodeURIComponent(b.id)}` as any)
                  }
                  className="active:opacity-70">
                  {i > 0 && <View className="h-px bg-neutral-200 dark:bg-neutral-700" />}
                  <View className="flex-row items-center gap-3 py-3">
                    <Avatar
                      size="md"
                      src={b.employee?.avatarUrl ?? undefined}
                      name={b.employee?.name ?? undefined}
                    />
                    <View className="min-w-0 flex-1">
                      <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                        {b.item?.name ?? t('homeRecentDefaultName')}
                      </ThemedText>
                      <ThemedText
                        className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                        numberOfLines={1}>
                        {b.employee?.name ?? '—'} · {b.branch?.name ?? ''}
                      </ThemedText>
                      <View className="mt-1 flex-row items-center gap-1">
                        <Icon
                          name="Calendar"
                          size={11}
                          className="text-light-subtext dark:text-dark-subtext"
                        />
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                          {formatHomeBookingSlotLabel(b)}
                        </ThemedText>
                      </View>
                    </View>
                    <Icon
                      name="ChevronRight"
                      size={16}
                      className="text-light-subtext dark:text-dark-subtext"
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <HomeTodayTeamSection
          cards={todayTeamCards}
          loading={todayTeamLoading}
          refreshingAvailability={todayTeamRefreshingAvailability}
          error={todayTeamError}
          locale={locale}
          t={t}
          className="mt-6"
          titleAction={{ titleKey: 'homeTodayTeamOpenFullTeam', href: '/experience' }}
        />
      </ThemeScroller>
    </>
  );
}
