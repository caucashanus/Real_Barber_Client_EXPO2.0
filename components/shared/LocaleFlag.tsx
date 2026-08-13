import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { localeFlag } from '@/constants/appLanguage';
import type { Locale } from '@/contexts/LanguageContext';

interface LocaleFlagProps {
  locale: Locale;
  size?: number;
  style?: ViewStyle;
}

/** Jedna vlajka podle locale — stejná šířka jako ikony v ListLink. */
export default function LocaleFlag({ locale, size = 24, style }: LocaleFlagProps) {
  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text style={{ fontSize: size * 0.85, lineHeight: size }}>{localeFlag(locale)}</Text>
    </View>
  );
}
