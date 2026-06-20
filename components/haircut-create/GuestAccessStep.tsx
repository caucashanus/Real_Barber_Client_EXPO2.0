import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import ThemedText from '@/components/ThemedText';
import Selectable from '@/components/forms/Selectable';
import type { HaircutStepProps } from '@/components/haircut-create/types';
import { GUEST_ACCESS_OPTIONS } from '@/constants/haircutWizardOptions';

export default function GuestAccessStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText className="mt-auto text-3xl font-semibold">
          {t('haircutCreateForWhichSeason')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateSelectMultiple')}
        </ThemedText>
      </View>

      <View className="mt-4">
        {GUEST_ACCESS_OPTIONS.map((option) => (
          <Selectable
            key={option.value}
            title={t(option.labelKey)}
            description={t(option.descKey)}
            selected={data.guestAccessTypes.includes(option.value)}
            customIcon={
              <Image source={option.iconImage} className="h-12 w-12" contentFit="contain" />
            }
            onPress={() => {
              const next = data.guestAccessTypes.includes(option.value)
                ? data.guestAccessTypes.filter((v) => v !== option.value)
                : [...data.guestAccessTypes, option.value];
              updateData({ guestAccessTypes: next });
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}
