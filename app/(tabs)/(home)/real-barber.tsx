import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';

import type { HomeReferralPromo } from '@/api/home';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHomePage } from '@/hooks/useHomePage';
import { useTranslation } from '@/hooks/useTranslation';
import HomeMoreCirclesSection from '@/components/home/HomeMoreCirclesSection';
import HomePromoFeedSection from '@/components/home/HomePromoFeedSection';
import HomeSpotlightSection from '@/components/home/HomeSpotlightSection';
import HomeFastBookStrip from '@/components/home/fast-book/HomeFastBookStrip';
import HomeNearestBranch from '@/components/home/HomeNearestBranch';
import HomeHaircutCatalogSection from '@/components/home/HomeHaircutCatalogSection';
import VisitPlanHomeOnboardingRedirect from '@/components/home/VisitPlanHomeOnboardingRedirect';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import SurfaceCard from '@/components/layout/SurfaceCard';
import NotificationPromptSheet from '@/components/NotificationPromptSheet';
import SiteLoadingState from '@/components/SiteLoadingState';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { useHomeTabScrollSync } from '@/hooks/useHomeTabScrollSync';
import { openPromoTargetUrl } from '@/utils/openPromoTargetUrl';
import {
  getClientReferralSlug,
  referralDashboardHref,
} from '@/utils/referralDashboardHelpers';
import { getHomePromoCarouselLayout } from '@/utils/homePromoLayout';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

/** Ikony dlaždic rychlých akcí — parita web mobil (§1.6). */
const HOME_ACTION_IMAGES = {
  create: require('@/assets/img/plus-ikon.png'),
  branches: require('@/assets/img/branches.png'),
  barbers: require('@/assets/img/barbers.png'),
} as const;

export default function RealBarberHomeTab() {
  const { scrollRef, onScroll, scrollEventThrottle, animatedScroll } = useHomeTabScrollSync();
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

  const promoClientSeedKey = client?.id ?? apiToken ?? '';

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

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <>
      <VisitPlanHomeOnboardingRedirect />
      <ThemeScroller
        ref={scrollRef}
        animatedScroll={animatedScroll}
        className="flex-1"
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accentColor} />
        }>
        <NotificationPromptSheet />
        <View className="flex-1 pt-4">
          {loading ? (
            <SiteLoadingState layout="section" className="py-16" />
          ) : (
            <>
              <View className="mb-6">
                <HomeFastBookStrip bookings={homeBookings} bookingsLoading={loading} />
              </View>
              <HomeMoreCirclesSection className="mt-0" />
              <HomePromoFeedSection
                posters={posters}
                coupons={coupons}
                referral={referral}
                clientSeedKey={promoClientSeedKey}
                layout={homePromoLayout}
                t={t}
                onReferralPress={handleReferralPromoPress}
              />

              <HomeSpotlightSection bookings={homeBookings} t={t} locale={locale} />

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
        </View>
      </ThemeScroller>
    </>
  );
}
