import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import Selectable from '@/components/forms/Selectable';
import type { HaircutStepProps } from '@/components/haircut-create/types';
import { PROPERTY_TYPE_OPTIONS } from '@/constants/haircutWizardOptions';

export default function PropertyTypeStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText variant="h1" className="mt-auto">
          {t('haircutCreateWhatDescribes')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateSelectMultiple')}
        </ThemedText>
      </View>
      <View className="mt-4">
        {PROPERTY_TYPE_OPTIONS.map((option) => (
          <Selectable
            key={option.value}
            title={t(option.labelKey)}
            selected={data.propertyTypes.includes(option.value)}
            customIcon={
              <Image source={option.iconImage} className="h-12 w-12" contentFit="contain" />
            }
            onPress={() => {
              const next = data.propertyTypes.includes(option.value)
                ? data.propertyTypes.filter((v) => v !== option.value)
                : [...data.propertyTypes, option.value];
              updateData({ propertyTypes: next });
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}
