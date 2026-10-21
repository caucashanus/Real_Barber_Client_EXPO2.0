import React from 'react';
import { RefreshControl, View } from 'react-native';

import { useAccentColor } from '@/contexts/AccentColorContext';
import { useBarbersRoster } from '@/hooks/useBarbersRoster';
import { useHomeTabScrollSync } from '@/hooks/useHomeTabScrollSync';
import { useTranslation } from '@/hooks/useTranslation';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import SectionIntroCard from '@/components/layout/SectionIntroCard';
import ThemeScroller from '@/components/ThemeScroller';

const ExperienceScreen = () => {
  const { scrollRef, onScroll, scrollEventThrottle, animatedScroll } = useHomeTabScrollSync();
  const { accentColor } = useAccentColor();
  const { t, locale } = useTranslation();
  const {
    teamCards,
    loading: teamLoading,
    refreshing: teamRefreshing,
    error: teamError,
    refresh,
  } = useBarbersRoster();

  return (
    <ThemeScroller
      ref={scrollRef}
      animatedScroll={animatedScroll}
      refreshControl={
        <RefreshControl refreshing={teamRefreshing} onRefresh={refresh} tintColor={accentColor} />
      }
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}>
      <View className="mt-4 flex-1">
        <SectionIntroCard
          t={t}
          titleKey="teamPageTitle"
          bodyKey="teamPageIntro"
          actionTitleKey="experienceSchedule"
          actionHref="/screens/schedule"
        />
        <HomeTodayTeamSection
          cards={teamCards}
          loading={teamLoading}
          refreshingAvailability={teamRefreshing}
          error={teamError}
          locale={locale}
          t={t}
          loadingTextKey="teamPageLoading"
          errorTextKey="teamPageLoadError"
          emptyTextKey="teamPageEmpty"
          contentOnly
        />
      </View>
    </ThemeScroller>
  );
};

export default ExperienceScreen;
