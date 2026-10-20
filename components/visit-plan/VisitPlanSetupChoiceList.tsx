import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales/en';
import { useTranslation } from '@/hooks/useTranslation';

export type VisitPlanSetupChoiceOption<T extends string> = {
  value: T;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: number;
};

type Props<T extends string> = {
  options: readonly VisitPlanSetupChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export default function VisitPlanSetupChoiceList<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}>
            <SurfaceCard
              rounded="2xl"
              className={`flex-row items-center gap-3 p-3 ${selected ? 'border-2 border-accent' : ''}`}>
              <View className="h-20 w-16 items-center justify-end overflow-hidden">
                <Image source={opt.icon} style={{ width: 64, height: 80 }} contentFit="contain" />
              </View>
              <View className="min-w-0 flex-1">
                <ThemedText className="text-base font-semibold">{t(opt.labelKey)}</ThemedText>
                <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                  {t(opt.descKey)}
                </ThemedText>
              </View>
            </SurfaceCard>
          </Pressable>
        );
      })}
    </View>
  );
}
