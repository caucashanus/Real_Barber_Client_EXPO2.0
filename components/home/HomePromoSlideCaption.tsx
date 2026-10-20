import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';

type Props = {
  title: string;
  subtitle?: string | null;
  className?: string;
};

/** Uber-style copy pod promo fotkou (mobilní strip). */
export default function HomePromoSlideCaption({ title, subtitle, className }: Props) {
  const sub = subtitle?.trim();
  return (
    <View className={`min-w-0 gap-1 ${className ?? ''}`}>
      <ThemedText className="text-base font-semibold leading-snug">{title}</ThemedText>
      {sub ? (
        <ThemedText className="text-sm leading-snug text-light-subtext dark:text-dark-subtext">
          {sub}
        </ThemedText>
      ) : null}
    </View>
  );
}
