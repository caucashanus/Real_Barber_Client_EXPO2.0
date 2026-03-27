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
          className="px-4 pt-4 pb-6"
          title={t('settingsDeleteAccountDetailsTitle')}
          subtitle={t('settingsDeleteAccountDetailsSubtitle')}
        />

        <View className="px-4 pb-10 gap-5">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-6">
            {t('settingsDeleteAccountDetailsIntro')}
          </ThemedText>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              1) {t('settingsDeleteAccountDetailsAccessTitle')}
            </ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-6">
              {t('settingsDeleteAccountDetailsAccessBody')}
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              2) {t('settingsDeleteAccountDetailsAnonymizationTitle')}
            </ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-6">
              {t('settingsDeleteAccountDetailsAnonymizationBody')}
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              3) {t('settingsDeleteAccountDetailsAuditTitle')}
            </ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-6">
              {t('settingsDeleteAccountDetailsAuditBody')}
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
              4) {t('settingsDeleteAccountDetailsKeepTitle')}
            </ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-6">
              {t('settingsDeleteAccountDetailsKeepBody')}
            </ThemedText>
          </View>

          <View className="rounded-xl bg-light-secondary dark:bg-dark-secondary p-4">
            <ThemedText className="text-sm font-semibold text-light-text dark:text-dark-text leading-6">
              {t('settingsDeleteAccountDetailsSummary')}
            </ThemedText>
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
