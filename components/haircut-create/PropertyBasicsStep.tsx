import React from 'react';
import { ScrollView, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import Counter from '@/components/forms/Counter';
import type { HaircutStepProps } from '@/components/haircut-create/types';

export default function PropertyBasicsStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText variant="h1" className="mt-auto">
          {t('haircutCreateBasicDetails')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateFillLengths')}
        </ThemedText>
      </View>

      <View className="mt-4">
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-1 pr-4">
            <ThemedText className="text-lg">{t('haircutCreateLengthAtEars')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('haircutCreateLengthCm')}
            </ThemedText>
          </View>
          <Counter
            value={data.guests}
            onChange={(value) => updateData({ guests: value ?? 0 })}
            min={0}
            max={20}
          />
        </View>

        <View className="flex-row items-center justify-between border-t border-light-secondary py-4 dark:border-dark-secondary">
          <View className="flex-1 pr-4">
            <ThemedText className="text-lg">{t('haircutCreateLengthOnTop')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('haircutCreateLengthCm')}
            </ThemedText>
          </View>
          <Counter
            value={data.bedrooms}
            onChange={(value) => updateData({ bedrooms: value ?? 0 })}
            min={0}
            max={20}
          />
        </View>

        <View className="flex-row items-center justify-between border-t border-light-secondary py-4 dark:border-dark-secondary">
          <View className="flex-1 pr-4">
            <ThemedText className="text-lg">{t('haircutCreateHowOftenTrim')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('haircutCreateWeeksToComeIn')}
            </ThemedText>
          </View>
          <Counter
            value={data.beds}
            onChange={(value) => updateData({ beds: value ?? 4 })}
            min={1}
            max={24}
          />
        </View>
      </View>
    </ScrollView>
  );
}
