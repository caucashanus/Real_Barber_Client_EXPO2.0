import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import CustomCard from '@/components/CustomCard';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

export default function InspiraceIntroCard() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="mb-6">
      <CustomCard
        rounded="2xl"
        padding="md"
        border
        background={false}
        className="bg-light-secondary dark:bg-dark-secondary">
        <ThemedText className="text-lg font-semibold">{t('inspiracePageTitle')}</ThemedText>
        <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
          {t('inspiracePageIntroBeforeStylist')}
          <ThemedText
            onPress={() => router.push('/experience')}
            className="text-sm leading-6 underline"
            style={{ color: colors.highlight }}
            accessibilityRole="link">
            {t('inspiracePageIntroStylistLink')}
          </ThemedText>
          {t('inspiracePageIntroAfterStylist')}
        </ThemedText>
      </CustomCard>
    </View>
  );
}
