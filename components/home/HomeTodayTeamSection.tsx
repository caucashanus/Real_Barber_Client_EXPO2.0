import React from 'react';
import { View } from 'react-native';

import type { Locale } from '@/contexts/LanguageContext';
import AppButton from '@/components/AppButton';
import BarberAvailabilityGrid from '@/components/home/BarberAvailabilityGrid';
import SurfaceCard from '@/components/layout/SurfaceCard';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import SiteLoadingState from '@/components/SiteLoadingState';

interface HomeTodayTeamTitleAction {
  titleKey: TranslationKey;
  href: string;
}

const DEFAULT_TITLE_ACTION: HomeTodayTeamTitleAction = {
  titleKey: 'experienceSchedule',
  href: '/screens/schedule'};

interface HomeTodayTeamSectionProps {
  cards: HomeTodayTeamCardModel[];
  loading: boolean;
  refreshingAvailability: boolean;
  error: string | null;
  locale: Locale;
  t: (key: TranslationKey) => string;
  className?: string;
  sectionTitleKey?: TranslationKey;
  loadingTextKey?: TranslationKey;
  errorTextKey?: TranslationKey;
  emptyTextKey?: TranslationKey;
  introTextKey?: TranslationKey;
  useCardLayout?: boolean;
  /** Jen mřížka karet (Rozvrh) — bez Section / intro karty. */
  contentOnly?: boolean;
  titleAction?: HomeTodayTeamTitleAction;
}

export default function HomeTodayTeamSection({
  cards,
  loading,
  refreshingAvailability,
  error,
  locale,
  t,
  className = '',
  sectionTitleKey = 'homeTodayTeamTitle',
  loadingTextKey = 'homeTodayTeamLoading',
  errorTextKey = 'homeTodayTeamLoadError',
  emptyTextKey = 'homeTodayTeamEmpty',
  introTextKey,
  useCardLayout = false,
  contentOnly = false,
  titleAction = DEFAULT_TITLE_ACTION}: HomeTodayTeamSectionProps) {
  const titleActionButton = (
    <AppButton
      variant="outline"
      size="sm"
      title={t(titleAction.titleKey)}
      href={titleAction.href}
    />
  );

  const teamContent = loading ? (
    <SiteLoadingState layout="section" size="compact" className="mt-2 py-6" />
  ) : error ? (
    <View className="mt-2 py-4">
      <ThemedText className="text-sm text-red-500 dark:text-red-400">
        {t(errorTextKey)}
      </ThemedText>
    </View>
  ) : cards.length === 0 ? (
    <View className="mt-2 py-4">
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
        {t(emptyTextKey)}
      </ThemedText>
    </View>
  ) : (
    <BarberAvailabilityGrid
      cards={cards}
      locale={locale}
      t={t}
      refreshing={refreshingAvailability}
    />
  );

  if (contentOnly) {
    return <View className={`w-full pb-4 ${className}`}>{teamContent}</View>;
  }

  if (useCardLayout) {
    return (
      <View className={`w-full pb-4 ${className}`}>
        <SurfaceCard rounded="2xl" className="p-4">
          <ThemedText className="text-lg font-semibold">{t(sectionTitleKey)}</ThemedText>
          {introTextKey ? (
            <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {t(introTextKey)}
            </ThemedText>
          ) : null}
          <View className="mt-4 w-full items-end">{titleActionButton}</View>
        </SurfaceCard>
        <View className="mt-6">{teamContent}</View>
      </View>
    );
  }

  return (
    <Section
      title={t(sectionTitleKey)}
      titleSize="lg"
      className={className}
      titleTrailingAlign="end"
      titleTrailing={titleActionButton}>
      {teamContent}
    </Section>
  );
}
