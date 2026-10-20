import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';

import { ScrollContext } from './_layout';

import type { HomeReferralPromo } from '@/api/home';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHomePage } from '@/hooks/useHomePage';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import { HomePromoCarousel } from '@/components/HomePromoCarousel';
import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import HomeMoreCirclesSection from '@/components/home/HomeMoreCirclesSection';
import HomeFastBookStrip from '@/components/home/fast-book/HomeFastBookStrip';
import HomeNearestBranch from '@/components/home/HomeNearestBranch';
import HomeHaircutCatalogSection from '@/components/home/HomeHaircutCatalogSection';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import SurfaceCard from '@/components/layout/SurfaceCard';
import NotificationPromptSheet from '@/components/NotificationPromptSheet';
import SiteLoadingState from '@/components/SiteLoadingState';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { homePromoClientSeed } from '@/utils/homePromoCoupon';
import { buildHomePromoFeed } from '@/utils/homePromoFeed';
import { openPromoTargetUrl } from '@/utils/openPromoTargetUrl';
import {
  getClientReferralSlug,
  referralDashboardHref,
} from '@/utils/referralDashboardHelpers';
import { pickHomeSpotlight } from '@/utils/homeSpotlight';
import { getHomePromoCarouselLayout } from '@/utils/homePromoLayout';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

/** Ikony dlaždic rychlých akcí — parita web mobil (§1.6). */
const HOME_ACTION_IMAGES = {
  create: require('@/assets/img/plus-ikon.png'),
  branches: require('@/assets/img/branches.png'),
  barbers: require('@/assets/img/barbers.png'),
} as const;

export default function RealBarberHomeTab() {
  const scrollY = useContext(ScrollContext);
  const { width: screenWidth } = useWindowDimensions();
  const homePromoLayout = useMemo(
    () => getHomePromoCarouselLayout(screenWidth),
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
    ],
    [t]
  );

  const {
    cards: todayTeamCards,
    bookings: homeBookings,
    coupons,
    posters,
    referral,
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

  const clientPromoSeed = useMemo(
    () => homePromoClientSeed(client?.id ?? apiToken ?? ''),
    [client?.id, apiToken]
  );

  const homePromoFeed = useMemo(
    () =>
      buildHomePromoFeed(posters, coupons, {
        nowMs: now,
        clientSeed: clientPromoSeed,
        referral,
      }),
    [posters, coupons, now, clientPromoSeed, referral]
  );

  const handleReferralPromoPress = useCallback(
    (promo: HomeReferralPromo) => {
      const link = promo.coverLinkUrl?.trim();
      if (link) {
        void openPromoTargetUrl(link);
        return;
      }
      if (client?.id) {
        router.push(referralDashboardHref(getClientReferralSlug(client.id)));
        return;
      }
      router.push(LOGIN_PATH);
    },
    [client?.id]
  );

  const showPromoCarousel = homePromoFeed.length > 0;

  return (
    <>
      <ThemeScroller
        className="flex-1"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accentColor} />
        }>
        <NotificationPromptSheet />
        <AnimatedView animation="scaleIn" className="mt-2 flex-1">
          {loading ? (
            <SiteLoadingState layout="section" className="py-16" />
          ) : (
            <>
              <View className="mb-4">
                <HomeFastBookStrip bookings={homeBookings} bookingsLoading={loading} />
              </View>
              <HomeMoreCirclesSection className="mt-2" />
              {showPromoCarousel ? (
                <View className="mt-6">
                  <HomePromoCarousel
                    feed={homePromoFeed}
                    layout={homePromoLayout}
                    loading={false}
                    t={t}
                    onReferralPress={handleReferralPromoPress}
                  />
                </View>
              ) : null}

              {spotlight ? (
                <View className="mt-4">
                  <HomeSpotlightCard spotlight={spotlight} t={t} locale={locale} />
                </View>
              ) : null}

              <View className="mb-4 mt-6 flex-row flex-wrap justify-between">
                {actions.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={a.onPress}
                    className="mb-2 w-[48.7%] active:opacity-70">
                    <SurfaceCard rounded="2xl" className="w-full">
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
                    </SurfaceCard>
                  </Pressable>
                ))}
                <HomeNearestBranch teamCards={todayTeamCards} locale={locale} t={t} />
              </View>

              <HomeTodayTeamSection
                cards={todayTeamCards}
                loading={false}
                refreshingAvailability={refreshing}
                error={todayTeamError}
                locale={locale}
                t={t}
                className="mt-10"
                showDayChips
              />

              <HomeHaircutCatalogSection locale={locale} t={t} className="mt-10" />
            </>
          )}
        </AnimatedView>
      </ThemeScroller>
    </>
  );
}
