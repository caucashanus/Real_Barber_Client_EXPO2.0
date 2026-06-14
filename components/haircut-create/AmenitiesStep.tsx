import React from 'react';
import { ScrollView, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';
import type { HaircutStepProps } from '@/components/haircut-create/types';
import { AMENITY_OPTIONS } from '@/constants/haircutWizardOptions';

export default function AmenitiesStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText className="mt-auto text-3xl font-semibold">
          {t('haircutCreateWhatGoesWith')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateSelectMultiple')}
        </ThemedText>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3">
        {AMENITY_OPTIONS.map((amenity) => (
          <Chip
            size="lg"
            key={amenity.label}
            label={t(amenity.labelKey)}
            icon={amenity.icon}
            isSelected={data.amenities.includes(amenity.label)}
            onPress={() => {
              const newAmenities = data.amenities.includes(amenity.label)
                ? data.amenities.filter((a) => a !== amenity.label)
                : [...data.amenities, amenity.label];
              updateData({ amenities: newAmenities });
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}
