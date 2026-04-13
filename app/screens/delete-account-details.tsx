import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';

export default function DeleteAccountDetailsScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton />
      <ThemedScroller>
        <Section
          titleSize="3xl"
          className="px-4 pb-6 pt-4"
          title={t('settingsDeleteAccountDetailsTitle')}
          subtitle={t('settingsDeleteAccountDetailsSubtitle')}
        />

        <View className="gap-5 px-4 pb-10">
          <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {t('settingsDeleteAccountDetailsIntro')}
          </ThemedText>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              1) {t('settingsDeleteAccountDetailsAccessTitle')}
            </ThemedText>
            <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {t('settingsDeleteAccountDetailsAccessBody')}
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              2) {t('settingsDeleteAccountDetailsAnonymizationTitle')}
            </ThemedText>
            <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {t('settingsDeleteAccountDetailsAnonymizationBody')}
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              3) {t('settingsDeleteAccountDetailsAuditTitle')}
            </ThemedText>
            <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {t('settingsDeleteAccountDetailsAuditBody')}
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              4) {t('settingsDeleteAccountDetailsKeepTitle')}
            </ThemedText>
            <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {t('settingsDeleteAccountDetailsKeepBody')}
            </ThemedText>
          </View>

          <View className="rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
            <ThemedText className="text-sm font-semibold leading-6 text-light-text dark:text-dark-text">
              {t('settingsDeleteAccountDetailsSummary')}
            </ThemedText>
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
