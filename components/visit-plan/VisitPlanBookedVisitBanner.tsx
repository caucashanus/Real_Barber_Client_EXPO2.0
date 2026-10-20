import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { fillTranslationParams } from '@/utils/fillTranslationParams';
import { formatVisitPlanBookedBannerSubtitle } from '@/utils/visitPlanBookingDisplay';
import { daysFromIso } from '@/utils/visitPlanDates';
import { formatVisitPlanDaysCount } from '@/utils/visitPlanIntervalDisplay';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';

type Props = {
  todayIso: string;
  booking: VisitPlanPastBooking;
};

export default function VisitPlanBookedVisitBanner({ todayIso, booking }: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { accentColor } = useAccentColor();
  const daysUntil = useMemo(
    () => daysFromIso(todayIso, booking.dateIso),
    [todayIso, booking.dateIso]
  );
  const subtitle = formatVisitPlanBookedBannerSubtitle(booking, locale);
  const daysLabel = formatVisitPlanDaysCount(locale, daysUntil);

  return (
    <View className="self-stretch overflow-hidden rounded-2xl border border-light-secondary dark:border-dark-secondary">
      <LinearGradient
        colors={[accentColor, `${accentColor}D9`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <ThemedText
              className={`font-bold leading-tight text-white ${
                daysUntil === 0 ? 'text-xl' : 'text-2xl'
              }`}>
              {daysUntil === 0
                ? t('visitPlanPageBannerBookedToday')
                : `${t('visitPlanPageBannerBookedPrefix')} ${daysLabel}`}
            </ThemedText>
            {subtitle ? (
              <ThemedText className="mt-1 text-xs font-normal text-white/90">{subtitle}</ThemedText>
            ) : null}
          </View>
          <AppButton
            size="sm"
            variant="outline"
            rounded="full"
            className="shrink-0 border-0 bg-white px-4"
            onPress={() =>
              router.push(`/screens/booking-detail?id=${encodeURIComponent(booking.id)}` as never)
            }
            accessibilityLabel={
              daysUntil === 0
                ? t('visitPlanPageBannerBookedTodayAria')
                : fillTranslationParams(t('visitPlanPageBannerBookedDaysAria'), {
                    days: daysLabel,
                  })
            }>
            <ThemedText className="text-sm font-semibold" style={{ color: accentColor }}>
              {t('visitPlanPageBannerDetailCta')}
            </ThemedText>
          </AppButton>
        </View>
      </LinearGradient>
    </View>
  );
}
