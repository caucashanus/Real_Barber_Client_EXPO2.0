import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { Locale } from '@/contexts/LanguageContext';
import BarberAvailabilityGrid from '@/components/home/BarberAvailabilityGrid';
import HomeSectionChipRow from '@/components/home/HomeSectionChipRow';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import { buildHomeScheduleDayChips } from '@/utils/homeScheduleDayChips';
import SiteLoadingState from '@/components/SiteLoadingState';

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
  /** Jen mřížka karet (Rozvrh) — bez Section / intro karty. */
  contentOnly?: boolean;
  /** Horizontální chipy dnů pod nadpisem (home „Dnes k dispozici“). */
  showDayChips?: boolean;
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
  contentOnly = false,
  showDayChips = false}: HomeTodayTeamSectionProps) {
  const dayChips = useMemo(
    () => (showDayChips ? buildHomeScheduleDayChips(locale, t) : []),
    [locale, showDayChips, t]
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

  return (
    <Section title={t(sectionTitleKey)} titleSize="lg" className={className}>
      {showDayChips ? <HomeSectionChipRow chips={dayChips} /> : null}
      {teamContent}
    </Section>
  );
}
