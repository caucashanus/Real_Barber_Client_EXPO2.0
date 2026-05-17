import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { getClientCoupons, type ClientCoupon } from '@/api/client-coupons';
import { getClientPosters, type ClientPoster } from '@/api/client-posters';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { ClientCouponValidityPills } from '@/components/ClientCouponValidityPills';
import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import Icon from '@/components/Icon';
import NotificationPromptSheet from '@/components/NotificationPromptSheet';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { getBookingEndDate, isBookingPast } from '@/utils/bookingHelpers';
import { getClientCouponValidityA11y } from '@/utils/clientCouponFormat';
import { pickDailyFeaturedHomePromoCoupon, homePromoClientSeed } from '@/utils/homePromoCoupon';
import { mergePostersAndCouponsRoundRobin, filterHomePosters } from '@/utils/homePromoFeed';
import { pickHomeSpotlight, formatHomeBookingSlotLabel } from '@/utils/homeSpotlight';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';
import { shadowPresets } from '@/utils/useShadow';

/** Jednotný formát kartičky jako u původních mock promo karet pod sekcí Tipy a nabídky. */
const HOME_COUPON_CARD_WIDTH = 280;
const HOME_COUPON_CARD_HEIGHT = 140;

/**
 * Levý „sloupec“ scrimu přes celou výšku karty — bez krátkého boxu nedělá vodorovnou řeznou
 * hranici uprostřed. Gradient sám řídí, kde je tmavší (nahoře vlevo) a kde zmizí.
 */
const COUPON_TEXT_SCRIM_BOX = {
  width: Math.round(HOME_COUPON_CARD_WIDTH * 0.78),
  height: HOME_COUPON_CARD_HEIGHT,
  borderBottomRightRadius: 42,
};

const COUPON_TEXT_SCRIM_GRADIENT = {
  colors: [
    'rgba(0,0,0,0.9)',
    'rgba(0,0,0,0.74)',
    'rgba(0,0,0,0.42)',
    'rgba(0,0,0,0.14)',
    'rgba(0,0,0,0)',
  ],
  locations: [0, 0.12, 0.34, 0.58, 1] as [number, number, number, number, number],
} as const;

const COUPON_IMAGE_TEXT_SHADOW_STYLE = {
  textShadowColor: 'rgba(0,0,0,0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

/** Kupóny skryté v sekci Tipy a nabídky i když je API vrátí (filtrování podle `name`). */
const HIDDEN_HOME_PROMO_COUPON_NAMES = new Set(['Gorila10', 'TVPRIMA10']);

function posterCardText(poster: ClientPoster): { primary: string; secondary: string | null } {
  const title = poster.title?.trim() ?? '';
  const subtitle = poster.subtitle?.trim() ?? '';
  if (title && subtitle) return { primary: title, secondary: subtitle };
  if (title) return { primary: title, secondary: null };
  if (subtitle) return { primary: subtitle, secondary: null };
  return { primary: '—', secondary: null };
}

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
        onPress: () => router.push('/trips' as any),
      },
    ],
    [t]
  );

  const [recentLoading, setRecentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<ClientCoupon[]>([]);
  const [posters, setPosters] = useState<ClientPoster[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!apiToken) {
      setAllBookings([]);
      setCoupons([]);
      setPosters([]);
      return;
    }
    await Promise.allSettled([
      getBookings(apiToken, { limit: 50, offset: 0 })
        .then((res) => setAllBookings(res.bookings))
        .catch(() => setAllBookings([])),
      getClientCoupons(apiToken)
        .then((list) => setCoupons(list))
        .catch(() => setCoupons([])),
      getClientPosters(apiToken)
        .then((list) => setPosters(list))
        .catch(() => setPosters([])),
    ]);
  }, [apiToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    setRecentLoading(true);
    loadData().finally(() => setRecentLoading(false));
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      Promise.allSettled([
        getBookings(apiToken, { limit: 50, offset: 0 })
          .then((res) => setAllBookings(res.bookings))
          .catch(() => {}),
        getClientCoupons(apiToken)
          .then((list) => setCoupons(list))
          .catch(() => {}),
        getClientPosters(apiToken)
          .then((list) => setPosters(list))
          .catch(() => {}),
      ]).catch(() => {});
    }, [apiToken])
  );

  const spotlight = useMemo(() => pickHomeSpotlight(allBookings, now), [allBookings, now]);

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

  const featuredHomePromoCoupon = useMemo(
    () =>
      pickDailyFeaturedHomePromoCoupon(homePromoCoupons, {
        nowMs: now,
        clientSeed: clientPromoSeed,
      }),
    [homePromoCoupons, now, clientPromoSeed]
  );

  const homePromoCouponsForMerge = useMemo(
    () => (featuredHomePromoCoupon ? [featuredHomePromoCoupon] : []),
    [featuredHomePromoCoupon]
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
        <View className="mt-4 px-global">
          {recentLoading ? null : spotlight ? (
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

          {apiToken && (recentLoading || homePromoFeed.length > 0) ? (
            <View className="-mx-global mt-6">
              <Section title={t('homePromoSectionTitle')} titleSize="md" />
              {recentLoading ? (
                <View className="mx-4 h-[200px] items-center justify-center rounded-2xl bg-light-secondary py-12 dark:bg-dark-secondary">
                  <ActivityIndicator size="small" />
                  <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                    {t('commonLoading')}
                  </ThemedText>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-global"
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingRight: 24,
                    paddingTop: 8,
                    paddingBottom: 4,
                  }}>
                  {homePromoFeed.map((item) => {
                    if (item.kind === 'coupon') {
                      const coupon = item.coupon;
                      const validityA11y = getClientCouponValidityA11y(
                        coupon.validFrom,
                        coupon.validUntil,
                        locale,
                        t,
                        { homeCardUntilOnly: true }
                      );
                      const hasValidity = validityA11y != null;
                      const hasImage = Boolean(coupon.imageUrl?.trim());
                      const titleCls = hasImage
                        ? 'text-base font-bold leading-tight text-white'
                        : 'text-base font-bold leading-tight text-light-text dark:text-dark-text';

                      return (
                        <Pressable
                          key={`c-${coupon.id}`}
                          onPress={() =>
                            router.push(
                              `/screens/client-coupon-detail?id=${encodeURIComponent(coupon.id)}` as any
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={[
                            t('homePromoBadgeCoupon'),
                            coupon.name,
                            coupon.benefitLabel,
                            validityA11y,
                          ]
                            .filter(Boolean)
                            .join('. ')}
                          style={[
                            shadowPresets.large,
                            {
                              width: HOME_COUPON_CARD_WIDTH,
                              height: HOME_COUPON_CARD_HEIGHT,
                              marginRight: 15,
                            },
                          ]}
                          className="relative flex-shrink-0 overflow-hidden rounded-2xl bg-light-secondary active:opacity-90 dark:bg-dark-secondary">
                          <View
                            className={
                              hasImage
                                ? 'bg-black/55 absolute left-2 top-2 z-30 rounded-full border border-white/40 px-2 py-0.5'
                                : 'absolute left-2 top-2 z-30 rounded-full border border-neutral-200 bg-light-primary/95 px-2 py-0.5 dark:border-dark-secondary dark:bg-dark-secondary/95'
                            }
                            pointerEvents="none">
                            <ThemedText
                              className={
                                hasImage
                                  ? 'text-[10px] font-semibold uppercase tracking-wide text-white'
                                  : 'text-[10px] font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext'
                              }>
                              {t('homePromoBadgeCoupon')}
                            </ThemedText>
                          </View>
                          {hasImage ? (
                            <>
                              <Image
                                source={{ uri: coupon.imageUrl! }}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                }}
                                contentFit="cover"
                              />
                              <LinearGradient
                                pointerEvents="none"
                                colors={[...COUPON_TEXT_SCRIM_GRADIENT.colors]}
                                locations={[...COUPON_TEXT_SCRIM_GRADIENT.locations]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  width: COUPON_TEXT_SCRIM_BOX.width,
                                  height: COUPON_TEXT_SCRIM_BOX.height,
                                  borderBottomRightRadius:
                                    COUPON_TEXT_SCRIM_BOX.borderBottomRightRadius,
                                }}
                              />
                            </>
                          ) : (
                            <View
                              pointerEvents="none"
                              className="absolute inset-0 bg-light-secondary dark:bg-dark-secondary"
                            />
                          )}
                          {hasValidity ? (
                            <View className="absolute bottom-2 right-2 z-20 max-w-[72%]">
                              <ClientCouponValidityPills
                                validFrom={coupon.validFrom}
                                validUntil={coupon.validUntil}
                                locale={locale}
                                t={t}
                                variant={hasImage ? 'cardImage' : 'cardSolid'}
                                align="end"
                              />
                            </View>
                          ) : null}
                          <View className="relative z-10 h-full justify-start px-4 pb-3 pt-8">
                            <View className="min-w-0 flex-1 justify-start">
                              <ThemedText
                                className={titleCls}
                                style={hasImage ? COUPON_IMAGE_TEXT_SHADOW_STYLE : undefined}
                                numberOfLines={2}>
                                {coupon.name}
                              </ThemedText>
                              <View
                                className={
                                  hasImage
                                    ? 'mt-1.5 max-w-full self-start rounded-full border border-white/25 bg-black/50 px-2 py-0.5'
                                    : 'mt-1.5 max-w-full self-start rounded-full border border-neutral-200 bg-light-primary px-2 py-0.5 dark:border-dark-secondary dark:bg-dark-secondary'
                                }
                                pointerEvents="none">
                                <ThemedText
                                  className={
                                    hasImage
                                      ? 'text-[10px] font-semibold leading-tight text-emerald-300'
                                      : 'text-[10px] font-semibold leading-tight text-emerald-600 dark:text-emerald-400'
                                  }
                                  numberOfLines={1}>
                                  {coupon.benefitLabel}
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      );
                    }

                    const poster = item.poster;
                    const { primary, secondary } = posterCardText(poster);
                    const hasImage = Boolean(poster.imageUrl?.trim());
                    const hasVideoOnly = !hasImage && Boolean(poster.videoUrl?.trim());
                    const hasMediaHero = hasImage || hasVideoOnly;
                    const titleCls = hasMediaHero
                      ? 'text-base font-bold leading-tight text-white'
                      : 'text-base font-bold leading-tight text-light-text dark:text-dark-text';

                    return (
                      <Pressable
                        key={`p-${poster.id}`}
                        onPress={() => openPosterTarget(poster)}
                        accessibilityRole="button"
                        accessibilityLabel={[primary, secondary].filter(Boolean).join('. ')}
                        style={[
                          shadowPresets.large,
                          {
                            width: HOME_COUPON_CARD_WIDTH,
                            height: HOME_COUPON_CARD_HEIGHT,
                            marginRight: 15,
                          },
                        ]}
                        className="relative flex-shrink-0 overflow-hidden rounded-2xl bg-light-secondary active:opacity-90 dark:bg-dark-secondary">
                        {hasImage ? (
                          <>
                            <Image
                              source={{ uri: poster.imageUrl!.trim() }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                              }}
                              contentFit="cover"
                            />
                            <LinearGradient
                              pointerEvents="none"
                              colors={[...COUPON_TEXT_SCRIM_GRADIENT.colors]}
                              locations={[...COUPON_TEXT_SCRIM_GRADIENT.locations]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: COUPON_TEXT_SCRIM_BOX.width,
                                height: COUPON_TEXT_SCRIM_BOX.height,
                                borderBottomRightRadius:
                                  COUPON_TEXT_SCRIM_BOX.borderBottomRightRadius,
                              }}
                            />
                          </>
                        ) : hasVideoOnly ? (
                          <View
                            pointerEvents="none"
                            className="absolute inset-0 items-center justify-center bg-neutral-900">
                            <LinearGradient
                              pointerEvents="none"
                              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.75)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                              }}
                            />
                            <View className="bg-white/15 rounded-full p-2">
                              <Icon name="Play" size={28} className="text-white" />
                            </View>
                          </View>
                        ) : (
                          <View
                            pointerEvents="none"
                            className="absolute inset-0 bg-light-secondary dark:bg-dark-secondary"
                          />
                        )}
                        <View className="relative z-10 h-full justify-start px-4 pb-3 pt-3">
                          <View className="min-w-0 flex-1 justify-start">
                            <ThemedText
                              className={titleCls}
                              style={hasMediaHero ? COUPON_IMAGE_TEXT_SHADOW_STYLE : undefined}
                              numberOfLines={2}>
                              {primary}
                            </ThemedText>
                            {secondary ? (
                              <ThemedText
                                className={
                                  hasMediaHero
                                    ? 'mt-1 text-sm font-semibold leading-tight text-white'
                                    : 'mt-1 text-sm font-semibold leading-tight text-light-text dark:text-dark-text'
                                }
                                style={hasMediaHero ? COUPON_IMAGE_TEXT_SHADOW_STYLE : undefined}
                                numberOfLines={2}>
                                {secondary}
                              </ThemedText>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : null}

          <Section title={t('homeRecentTitle')} titleSize="md" className="mt-6" />
          {recentLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator size="small" />
              <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                {t('homeRecentLoading')}
              </ThemedText>
            </View>
          ) : recentBookings.length === 0 ? (
            <View className="py-4">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('homeRecentEmpty')}
              </ThemedText>
            </View>
          ) : (
            <View className="-mx-global overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
              {recentBookings.map((b, i) => (
                <Pressable
                  key={b.id}
                  onPress={() =>
                    router.push(`/screens/trip-detail?id=${encodeURIComponent(b.id)}` as any)
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
