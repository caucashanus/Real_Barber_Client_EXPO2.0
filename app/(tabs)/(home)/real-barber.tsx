import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';

import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useHomePage } from '@/app/hooks/useHomePage';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { HomePromoCarousel } from '@/components/HomePromoCarousel';
import { HomeRepeatBookingCard } from '@/components/HomeRepeatBookingCard';
import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import HomeNearestBranch from '@/components/home/HomeNearestBranch';
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
import { getContentCarouselSize } from '@/utils/contentCarouselLayout';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

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
    () => getContentCarouselSize(screenWidth),
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
    cards: todayTeamCards,
    bookings: homeBookings,
    coupons,
    posters,
    loading,
    refreshing,
    error: todayTeamError,
    refresh,
  } = useHomePage();
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const spotlight = useMemo(() => pickHomeSpotlight(homeBookings, now), [homeBookings, now]);

  const repeatBooking = useMemo(
    () => pickRepeatBookingCandidate(homeBookings, now),
    [homeBookings, now]
  );

  const recentBookings = useMemo(
    () =>
      homeBookings
        .filter(isBookingPast)
        .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
        .slice(0, 3),
    [homeBookings]
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

  const showPromoCarousel = loading || homePromoFeed.length > 0;

  return (
    <>
      <ThemeScroller
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accentColor} />
        }>
        <NotificationPromptSheet />
        {showPromoCarousel ? (
          <View className="mt-4">
            <HomePromoCarousel
              feed={homePromoFeed}
              width={homePromoCarouselSize.width}
              height={homePromoCarouselSize.height}
              loading={loading}
              locale={locale}
              t={t}
            />
          </View>
        ) : null}
        {!loading && repeatBooking ? (
          <View className={showPromoCarousel ? 'mt-0' : 'mt-4'}>
            <HomeRepeatBookingCard booking={repeatBooking} t={t} />
          </View>
        ) : null}

        {!loading && spotlight ? (
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
          <HomeNearestBranch
            teamCards={todayTeamCards}
            locale={locale}
            t={t}
            homeRefreshing={refreshing}
          />
        </View>

        {!loading && recentBookings.length > 0 ? (
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
          loading={loading}
          refreshingAvailability={refreshing}
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
