import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';

import { getClientCoupons, type ClientCoupon } from '@/api/client-coupons';
import { getClientPosters, type ClientPoster } from '@/api/client-posters';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBookings } from '@/app/contexts/BookingsBadgeContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { HomeRepeatBookingCard } from '@/components/HomeRepeatBookingCard';
import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
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

/** Stejná šířka jako `-mx-global` bloky uvnitř `px-global` (padding 24 px × 2). */
const HOME_LAYOUT_HORIZONTAL_PADDING = 48;

function getHomePromoCarouselSize(screenWidth: number) {
  const width = screenWidth - HOME_LAYOUT_HORIZONTAL_PADDING;
  return {
    width,
    height: Math.round(width / 2),
  };
}

interface HomePromoSlide {
  id: string;
  imageUrl: string;
  onPress: () => void;
}

/** Kupóny skryté v sekci Tipy a nabídky i když je API vrátí (filtrování podle `name`). */
const HIDDEN_HOME_PROMO_COUPON_NAMES = new Set(['Gorila10', 'TVPRIMA10']);

function openPosterTarget(poster: ClientPoster): void {
  const web = poster.websiteUrl?.trim();
  const vid = poster.videoUrl?.trim();
  if (web) {
    WebBrowser.openBrowserAsync(web).catch(() => {});
    return;
  }
  if (vid) {
    WebBrowser.openBrowserAsync(vid).catch(() => {});
  }
}

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
        id: 'create',
        title: t('homeCreateBooking'),
        subtitle: t('homeCreateBookingSubtitle'),
        icon: 'Scissors',
        onPress: async () => {
          const suppressed = await isReservationIntroCooldownActive();
          router.push(
            suppressed ? '/screens/reservation-create' : '/screens/reservation-create-start'
          );
        },
      },
      {
        id: 'branches',
        title: t('homeBranches'),
        subtitle: t('homeBranchesSubtitle'),
        icon: 'MapPin',
        onPress: () => router.push('/branches' as any),
      },
      {
        id: 'barbers',
        title: t('homeBarbers'),
        subtitle: t('homeBarbersSubtitle'),
        icon: 'Users',
        onPress: () => router.push('/experience' as any),
      },
      {
        id: 'bookings',
        title: t('homeBookings'),
        subtitle: t('homeBookingsSubtitle'),
        icon: 'Calendar',
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
      getClientCoupons(apiToken)
        .then((list) => setCoupons(list))
        .catch(() => setCoupons([])),
      getClientPosters(apiToken)
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
    ]);
    setRefreshing(false);
  }, [refreshBookings, loadPromoData]);

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

  const homePromoSlides = useMemo((): HomePromoSlide[] => {
    const slides: HomePromoSlide[] = [];
    for (const item of homePromoFeed) {
      if (item.kind === 'coupon') {
        const imageUrl = item.coupon.imageUrl?.trim();
        if (!imageUrl) continue;
        slides.push({
          id: `c-${item.coupon.id}`,
          imageUrl,
          onPress: () => {
            router.push(
              `/screens/client-coupon-detail?id=${encodeURIComponent(item.coupon.id)}` as never
            );
          },
        });
        continue;
      }
      const imageUrl = item.poster.imageUrl?.trim();
      if (!imageUrl) continue;
      slides.push({
        id: `p-${item.poster.id}`,
        imageUrl,
        onPress: () => openPosterTarget(item.poster),
      });
    }
    return slides;
  }, [homePromoFeed]);

  const homePromoImages = useMemo(
    () => homePromoSlides.map((slide) => slide.imageUrl),
    [homePromoSlides]
  );

  const handleHomePromoPress = useCallback(
    (index: number) => {
      homePromoSlides[index]?.onPress();
    },
    [homePromoSlides]
  );

  return (
    <>
      <ThemeScroller
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
        }>
        <NotificationPromptSheet />
        <View className="px-global">
          {apiToken && (recentLoading || homePromoSlides.length > 0) ? (
            <View className="-mx-global mb-4 mt-4">
              {recentLoading ? (
                <View
                  style={{ height: homePromoCarouselSize.height }}
                  className="w-full items-center justify-center rounded-2xl bg-light-secondary dark:bg-dark-secondary">
                  <ActivityIndicator size="small" />
                  <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                    {t('commonLoading')}
                  </ThemedText>
                </View>
              ) : (
                <ImageCarousel
                  width={homePromoCarouselSize.width}
                  rounded="2xl"
                  height={homePromoCarouselSize.height}
                  className="w-full"
                  images={homePromoImages}
                  paginationStyle="dots"
                  onImagePress={handleHomePromoPress}
                />
              )}
            </View>
          ) : null}
          {!recentLoading && repeatBooking ? (
            <View className="-mx-global mt-4">
              <HomeRepeatBookingCard booking={repeatBooking} t={t} />
            </View>
          ) : null}

          {!recentLoading && spotlight ? (
            <View className="-mx-global mt-4">
              <HomeSpotlightCard spotlight={spotlight} t={t} locale={locale} />
            </View>
          ) : null}

          <View className="-mx-global mt-6 flex-row flex-wrap justify-between px-0">
            {actions.map((a) => (
              <Pressable
                key={a.id}
                onPress={a.onPress}
                className="mb-2 w-[48.7%] rounded-2xl bg-light-secondary dark:bg-dark-secondary">
                <View className="items-center p-4">
                  {a.id === 'create' && (
                    <Image
                      source={require('@/assets/img/plus-ikon.png')}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                      className="mb-2"
                    />
                  )}
                  {a.id === 'branches' && (
                    <Image
                      source={require('@/assets/img/search-modal-branches.png')}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                      className="mb-2"
                    />
                  )}
                  {a.id === 'barbers' && (
                    <Image
                      source={require('@/assets/img/barbers.png')}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                      className="mb-2"
                    />
                  )}
                  {a.id === 'bookings' && (
                    <Image
                      source={require('@/assets/img/search-modal-bookings.png')}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                      className="mb-2"
                    />
                  )}
                  <ThemedText className="text-base font-semibold">{a.title}</ThemedText>
                  <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
                    {a.subtitle}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>

          <Section title={t('homeRecentTitle')} titleSize="md" className="mt-6" />
          {recentLoading ? (
            <View className="mt-2 items-center py-6">
              <ActivityIndicator size="small" />
              <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                {t('homeRecentLoading')}
              </ThemedText>
            </View>
          ) : recentBookings.length === 0 ? (
            <View className="mt-2 py-4">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('homeRecentEmpty')}
              </ThemedText>
            </View>
          ) : (
            <View className="-mx-global mt-2 overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
              {recentBookings.map((b, i) => (
                <Pressable
                  key={b.id}
                  onPress={() =>
                    router.push(`/screens/booking-detail?id=${encodeURIComponent(b.id)}` as any)
                  }
                  className="active:opacity-70">
                  {i > 0 && <View className="mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />}
                  <View className="flex-row items-center gap-3 px-4 py-3">
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
          )}
        </View>
      </ThemeScroller>
    </>
  );
}
