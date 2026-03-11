import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function RescheduleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();

  return (
    <>
      <Header title={t('rescheduleTitle')} showBackButton />
      <ThemedScroller className="flex-1">
        <Section titleSize="lg" className="px-global pt-4">
          <View className="py-2">
            <ThemedText className="text-light-text dark:text-dark-text">
              {t('reschedulePlaceholder')}
            </ThemedText>
          </View>
        </Section>
      </ThemedScroller>
    </>
  );
}
