import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';

export default function ProductPurchaseInfoScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton />
      <ThemedScroller className="p-global pb-8">
        <Section
          titleSize="2xl"
          className="mb-4"
          title={t('productPurchaseInfoTitle')}
        />
        <View className="gap-5">
          <ThemedText className="text-base text-light-text dark:text-dark-text leading-7">
            {t('productPurchaseInfoP1')}
          </ThemedText>
          <ThemedText className="text-base text-light-text dark:text-dark-text leading-7">
            {t('productPurchaseInfoP2')}
          </ThemedText>
          <ThemedText className="text-base text-light-text dark:text-dark-text leading-7">
            {t('productPurchaseInfoP3')}
          </ThemedText>
          <View className="rounded-xl bg-light-secondary dark:bg-dark-secondary p-4 mt-2">
            <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text leading-7">
              {t('productPurchaseInfoThanks')}
            </ThemedText>
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
