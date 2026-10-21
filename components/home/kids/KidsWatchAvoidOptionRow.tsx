import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { KidsWatchAvoidOption } from '@/constants/kidsWatchAvoidOptions';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';

type Props = {
  option: KidsWatchAvoidOption;
  selected: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
};

export default function KidsWatchAvoidOptionRow({ option, selected, onToggle, t }: Props) {
  const colors = useThemeColors();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = option.image != null && !imageFailed;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className="flex-row items-center gap-3 rounded-xl px-3 py-3 active:opacity-70">
      <View className="h-12 w-12 shrink-0 items-center justify-center">
        {showImage ? (
          <Image
            source={option.image!}
            style={{ width: 48, height: 48 }}
            contentFit="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon name={option.icon} size={28} strokeWidth={2} color={colors.text} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <ThemedText className="text-sm font-medium">{t(option.labelKey)}</ThemedText>
        <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
          {t(option.descriptionKey)}
        </ThemedText>
      </View>
      {selected ? (
        <Icon name="Check" size={20} strokeWidth={2.5} color={colors.highlight} />
      ) : (
        <View className="h-5 w-5 shrink-0 rounded-full border border-light-subtext/40 dark:border-dark-subtext/40" />
      )}
    </Pressable>
  );
}
