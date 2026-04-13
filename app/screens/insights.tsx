import React from 'react';
import { View } from 'react-native';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Grid from '@/components/layout/Grid';
import Section from '@/components/layout/Section';
import { shadowPresets } from '@/utils/useShadow';

const InsightsScreen = () => {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <>
      <Header title=" " showBackButton />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
        <Section title={t('insightsTitle')} titleSize="3xl" className="py-10" />
        <Grid columns={2} spacing={10}>
          <InsightCard
            icon="Calendar"
            title={t('insightsLongerStays')}
            percentage={25}
            amount="1/4"
          />
          <InsightCard
            icon="WashingMachine"
            title={t('insightsAmenities')}
            percentage={50}
            amount="2/4"
          />
          <InsightCard
            icon="SlidersHorizontal"
            title={t('insightsFlexibleStays')}
            percentage={75}
            amount="3/4"
          />
          <InsightCard
            icon="Users"
            title={t('insightsFamilyTravel')}
            percentage={50}
            amount="2/4"
          />
          <InsightCard icon="Waves" title={t('insightsBeachfront')} percentage={25} amount="1/4" />
          <InsightCard icon="Dog" title={t('insightsPetFriendly')} percentage={50} amount="2/4" />
          <InsightCard icon="Home" title={t('insightsStar')} percentage={75} amount="3/4" />
        </Grid>
      </ThemedScroller>
    </>
  );
};

const InsightCard = (props: any) => {
  const colors = useThemeColors();
  return (
    <View
      style={{ ...shadowPresets.large }}
      className="rounded-3xl bg-light-primary p-4 dark:bg-dark-secondary">
      <Icon
        name={props.icon}
        size={20}
        strokeWidth={2}
        color="white"
        style={{ backgroundColor: colors.highlight }}
        className="mb-20 h-12 w-12 rounded-full"
      />
      <ThemedText className="mb-1 text-xl font-semibold">{props.title}</ThemedText>
      <View className="w-full flex-row items-center">
        <View className="mr-3 h-2 flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800">
          <View
            style={{ backgroundColor: colors.highlight, width: `${props.percentage}%` }}
            className="h-full rounded-full"
          />
        </View>
        <ThemedText className="text-sm opacity-50">{props.amount}</ThemedText>
      </View>
    </View>
  );
};

export default InsightsScreen;
