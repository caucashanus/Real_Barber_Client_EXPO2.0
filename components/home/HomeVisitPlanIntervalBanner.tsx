import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import VisitPlanHomeCountdownHeadline from '@/components/home/VisitPlanHomeCountdownHeadline';
import AppButton from '@/components/AppButton';
import type { Booking } from '@/api/bookings';
import { visitPlanPageBannerImageSource } from '@/constants/visitPlanOnboardingAssets';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { visitPlanNearestUpcomingBookingDate } from '@/utils/visitPlanBookingsHelpers';
import { resolveVisitPlanPageBannerTiming } from '@/utils/visitPlanDates';
import { formatVisitPlanDaysCount } from '@/utils/visitPlanIntervalDisplay';
import { shouldShowHomeVisitPlanIntervalBanner } from '@/utils/visitPlanHomeIntervalBanner';
import { resolveVisitPlanPageBannerImageVariant } from '@/utils/visitPlanPageBannerImage';

type Props = {
  /** Stejný seznam jako home feed / fast book (parita web HomeClientDataProvider). */
  homeBookings?: readonly Booking[] | null;
};

export default function HomeVisitPlanIntervalBanner({ homeBookings }: Props) {
  const { apiToken, isLoading: authLoading } = useAuth();
  const { accentColor } = useAccentColor();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const {
    loading,
    hasStoredPlan,
    lastCompletedVisitDate,
    nextVisitTarget,
    todayIso,
  } = useVisitPlan();

  const upcomingBookingDate = useMemo(
    () => visitPlanNearestUpcomingBookingDate(homeBookings ?? []),
    [homeBookings]
  );

  const planBootstrapping =
    authLoading || (loading && !hasStoredPlan && !lastCompletedVisitDate);

  const visible = useMemo(
    () =>
      shouldShowHomeVisitPlanIntervalBanner({
        hasStoredPlan,
        lastCompletedVisitDate,
        nextVisitTarget,
        upcomingBookingDate,
      }),
    [hasStoredPlan, lastCompletedVisitDate, nextVisitTarget, upcomingBookingDate]
  );

  const timing = useMemo(() => {
    if (!nextVisitTarget) return null;
    return resolveVisitPlanPageBannerTiming(todayIso, nextVisitTarget);
  }, [todayIso, nextVisitTarget]);

  const inDaysCount = timing?.kind === 'inDays' ? timing.days : 0;
  const daysLabel = useMemo(() => {
    if (timing?.kind !== 'inDays') return '';
    const prefix = t('homeVisitPlanIntervalBannerInDaysPrefix');
    return `${prefix} ${formatVisitPlanDaysCount(locale, inDaysCount)}`.trim();
  }, [timing?.kind, t, locale, inDaysCount]);

  const imageVariant = useMemo(() => {
    if (!nextVisitTarget) return 'default' as const;
    return resolveVisitPlanPageBannerImageVariant({
      firstVisit: false,
      todayIso,
      nextVisitTarget,
    });
  }, [todayIso, nextVisitTarget]);

  if (!apiToken || planBootstrapping || !visible || !timing) return null;

  const imageSource = visitPlanPageBannerImageSource(imageVariant);
  const goCalendar = () => router.push('/screens/visit-plan-calendar');

  return (
    <View className="relative mb-6 min-h-[176px] w-full self-stretch overflow-hidden rounded-2xl">
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="right center"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View className="relative z-10 min-h-[176px] w-full justify-between p-5">
        <View className="max-w-[88%] items-start">
          <VisitPlanHomeCountdownHeadline
            timing={timing}
            daysLabel={daysLabel}
            accentColor={accentColor}
          />
        </View>
        <View className="w-full items-start self-start">
          <AppButton
            size="sm"
            variant="default"
            rounded="full"
            className="min-h-[44px] self-start px-4 py-2.5"
            title={t('homeVisitPlanIntervalBannerCalendarCta')}
            textClassName="text-white"
            onPress={goCalendar}
            accessibilityLabel={t('homeVisitPlanIntervalBannerCalendarCta')}
          />
        </View>
      </View>
    </View>
  );
}
