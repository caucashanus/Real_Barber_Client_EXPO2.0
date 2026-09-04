import React, { useContext } from 'react';
import { Animated, RefreshControl } from 'react-native';

import { ScrollContext } from './_layout';

import { useAccentColor } from '@/contexts/AccentColorContext';
import { useBarbersRoster } from '@/hooks/useBarbersRoster';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import SectionIntroCard from '@/components/layout/SectionIntroCard';
import ThemeScroller from '@/components/ThemeScroller';

const ExperienceScreen = () => {
  const scrollY = useContext(ScrollContext);
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
      refreshControl={
        <RefreshControl refreshing={teamRefreshing} onRefresh={refresh} tintColor={accentColor} />
      }
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
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
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ExperienceScreen;
