import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import { visitPlanPageBannerImageSource } from '@/constants/visitPlanOnboardingAssets';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/locales';
import { fillTranslationParams } from '@/utils/fillTranslationParams';
import {
  resolveVisitPlanPageBannerTiming,
  type VisitPlanPageBannerTiming,
} from '@/utils/visitPlanDates';
import { resolveVisitPlanPageBannerImageVariant } from '@/utils/visitPlanPageBannerImage';
import { formatVisitPlanDaysCount } from '@/utils/visitPlanIntervalDisplay';

type Props =
  | {
      variant?: 'countdown';
      todayIso: string;
      nextVisitTarget: string;
      onEditInterval?: never;
    }
  | {
      variant: 'firstVisit';
      todayIso?: never;
      nextVisitTarget?: never;
    };

function BannerHeadline({
  timing,
  t,
  daysLabel,
  accentColor,
}: {
  timing: VisitPlanPageBannerTiming;
  t: (key: TranslationKey) => string;
  daysLabel: string;
  accentColor: string;
}) {
  const headlineClass = 'text-2xl font-bold leading-tight';
  const accentStyle = { color: accentColor };
  const whiteClass = `${headlineClass} !text-white`;

  if (timing.kind === 'overdue') {
    return (
      <ThemedText accessibilityRole="header">
        <ThemedText className={headlineClass} style={accentStyle}>
          {t('visitPlanPageBannerOverdueAccent')}
        </ThemedText>
        <ThemedText className={whiteClass}>{` ${t('visitPlanPageBannerOverdueRest')}`}</ThemedText>
      </ThemedText>
    );
  }

  if (timing.kind === 'dueToday') {
    return (
      <ThemedText className={headlineClass} style={accentStyle} accessibilityRole="header">
        {t('visitPlanPageBannerDueTodayAccent')}
      </ThemedText>
    );
  }

  if (timing.kind === 'tomorrow') {
    return (
      <ThemedText className={headlineClass} style={accentStyle} accessibilityRole="header">
        {t('visitPlanPageBannerTomorrowAccent')}
      </ThemedText>
    );
  }

  return (
    <ThemedText accessibilityRole="header">
      <ThemedText className={whiteClass}>{`${t('visitPlanPageBannerInPrefix')} `}</ThemedText>
      <ThemedText className={headlineClass} style={accentStyle}>
        {daysLabel}
      </ThemedText>
    </ThemedText>
  );
}

function bannerSublineKey(timing: VisitPlanPageBannerTiming): TranslationKey {
  if (timing.kind === 'overdue') return 'visitPlanPageBannerOverdueSubline';
  if (timing.kind === 'dueToday') return 'visitPlanPageBannerDueTodaySubline';
  if (timing.kind === 'tomorrow') return 'visitPlanPageBannerTomorrowSubline';
  return 'visitPlanPageBannerFutureSubline';
}

function bannerAriaLabel(
  timing: VisitPlanPageBannerTiming,
  t: (key: TranslationKey) => string,
  daysLabel: string
): string {
  if (timing.kind === 'overdue') return t('visitPlanPageBannerOverdueAria');
  if (timing.kind === 'dueToday') return t('visitPlanPageBannerDueTodayAria');
  if (timing.kind === 'tomorrow') return t('visitPlanPageBannerTomorrowAria');
  return fillTranslationParams(t('visitPlanPageBannerInDaysAria'), { days: daysLabel });
}

export default function VisitPlanPageBanner(props: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { accentColor } = useAccentColor();
  const variant = props.variant ?? 'countdown';
  const isFirstVisit = variant === 'firstVisit';

  const timing = useMemo((): VisitPlanPageBannerTiming => {
    if (variant === 'firstVisit') return { kind: 'inDays', days: 0 };
    const countdown = props as Extract<Props, { variant?: 'countdown' }>;
    return resolveVisitPlanPageBannerTiming(countdown.todayIso, countdown.nextVisitTarget);
  }, [props, variant]);

  const inDaysCount = timing.kind === 'inDays' ? timing.days : 0;
  const daysLabel = formatVisitPlanDaysCount(locale, inDaysCount);

  const imageVariant = useMemo(() => {
    if (isFirstVisit) {
      return resolveVisitPlanPageBannerImageVariant({
        firstVisit: true,
        todayIso: '',
        nextVisitTarget: '',
      });
    }
    const countdown = props as Extract<Props, { variant?: 'countdown' }>;
    return resolveVisitPlanPageBannerImageVariant({
      firstVisit: false,
      todayIso: countdown.todayIso,
      nextVisitTarget: countdown.nextVisitTarget,
    });
  }, [isFirstVisit, props]);

  const imageSource = visitPlanPageBannerImageSource(imageVariant);
  const goBook = () => router.push('/(tabs)/(home)/real-barber' as never);

  const accessibilityLabel = isFirstVisit
    ? t('visitPlanFirstVisitBannerAria')
    : bannerAriaLabel(timing, t, daysLabel);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className="relative min-h-[176px] self-stretch overflow-hidden rounded-2xl border border-light-secondary dark:border-dark-secondary">
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="right center"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View className="relative z-10 min-h-[176px] w-full justify-between p-5">
        <View className="max-w-[72%] items-start">
          {isFirstVisit ? (
            <ThemedText className="text-2xl font-bold leading-tight text-white" accessibilityRole="header">
              {t('visitPlanFirstVisitBannerTitle')}
            </ThemedText>
          ) : (
            <BannerHeadline
              timing={timing}
              t={t}
              daysLabel={daysLabel}
              accentColor={accentColor}
            />
          )}
          <ThemedText className="mt-1 text-[11px] leading-4 text-white/75">
            {isFirstVisit
              ? t('visitPlanFirstVisitBannerLead')
              : t(bannerSublineKey(timing))}
          </ThemedText>
        </View>
        <View className="w-full items-start self-start">
          <AppButton
            size="sm"
            variant="default"
            rounded="full"
            className="min-h-[44px] self-start px-4 py-2.5"
            title={t('visitPlanPageBannerBookCta')}
            textClassName="text-white"
            onPress={goBook}
            accessibilityLabel={t('visitPlanPageBannerBookCta')}
          />
        </View>
      </View>
    </View>
  );
}
