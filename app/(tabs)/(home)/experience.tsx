import React, { useContext } from 'react';
import { Animated } from 'react-native';

import { ScrollContext } from './_layout';

import { useBarbersRoster } from '@/hooks/useBarbersRoster';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import HomeTodayTeamSection from '@/components/home/HomeTodayTeamSection';
import ThemeScroller from '@/components/ThemeScroller';

const ExperienceScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { t, locale } = useTranslation();
  const {
    teamCards,
    loading: teamLoading,
    refreshing: teamRefreshing,
    error: teamError,
  } = useBarbersRoster();

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
        <HomeTodayTeamSection
          cards={teamCards}
          loading={teamLoading}
          refreshingAvailability={teamRefreshing}
          error={teamError}
          locale={locale}
          t={t}
          sectionTitleKey="teamPageTitle"
          loadingTextKey="teamPageLoading"
          errorTextKey="teamPageLoadError"
          emptyTextKey="teamPageEmpty"
          introTextKey="teamPageIntro"
          useCardLayout
        />
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ExperienceScreen;
