import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { Locale } from '@/contexts/LanguageContext';
import AppButton from '@/components/AppButton';
import BarberAvailabilityGrid from '@/components/home/BarberAvailabilityGrid';
import CustomCard from '@/components/CustomCard';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';

interface HomeTodayTeamTitleAction {
  titleKey: TranslationKey;
  href: string;
}

const DEFAULT_TITLE_ACTION: HomeTodayTeamTitleAction = {
  titleKey: 'experienceSchedule',
  href: '/screens/schedule',
};

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
  titleAction = DEFAULT_TITLE_ACTION,
}: HomeTodayTeamSectionProps) {
  const titleActionButton = (
    <AppButton
      variant="outline"
      size="sm"
      title={t(titleAction.titleKey)}
      href={titleAction.href}
    />
  );

  const teamContent = loading ? (
    <View className="mt-2 items-center py-6">
      <ActivityIndicator size="small" />
      <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
        {t(loadingTextKey)}
      </ThemedText>
    </View>
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
        <CustomCard
          rounded="2xl"
          padding="md"
          border
          background={false}
          className="bg-light-secondary dark:bg-dark-secondary">
          <ThemedText className="text-lg font-semibold">{t(sectionTitleKey)}</ThemedText>
          {introTextKey ? (
            <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {t(introTextKey)}
            </ThemedText>
          ) : null}
          <View className="mt-4 w-full items-end">{titleActionButton}</View>
        </CustomCard>
        {teamContent}
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
