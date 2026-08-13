import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import LocaleFlag from '@/components/shared/LocaleFlag';
import ThemedText from '@/components/ThemedText';
import type { AppLocaleItem } from '@/constants/appLanguage';
import { useAccentColor } from '@/contexts/AccentColorContext';
import type { Locale } from '@/contexts/LanguageContext';

interface LanguageSwitcherRowProps {
  item: AppLocaleItem;
  selected: boolean;
  onPress: () => void;
}

export default function LanguageSwitcherRow({ item, selected, onPress }: LanguageSwitcherRowProps) {
  const { accentColor } = useAccentColor();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.label}, ${item.subtitle}${selected ? ', selected' : ''}`}
      onPress={onPress}
      className="w-full flex-row items-center gap-3 rounded-md px-3 py-2.5 active:bg-light-secondary/50 dark:active:bg-dark-secondary/50">
      <LocaleFlag locale={item.locale as Locale} size={20} />
      <View className="min-w-0 flex-1">
        <ThemedText className="text-sm font-medium">{item.label}</ThemedText>
        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
          {item.subtitle}
        </ThemedText>
      </View>
      {selected ? (
        <Icon name="Check" size={20} strokeWidth={2.5} color={accentColor} />
      ) : (
        <View className="h-5 w-5" />
      )}
    </Pressable>
  );
}
