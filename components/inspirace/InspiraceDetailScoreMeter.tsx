import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';

interface InspiraceDetailScoreMeterProps {
  value: number;
  max?: number;
  label: string;
  showLabel?: boolean;
}

export default function InspiraceDetailScoreMeter({
  value,
  max = 5,
  label,
  showLabel = true,
}: InspiraceDetailScoreMeterProps) {
  const colors = useThemeColors();
  const clamped = Math.min(Math.max(Math.round(value), 0), max);
  if (clamped < 1) return null;

  return (
    <View>
      {showLabel ? (
        <ThemedText className="mb-3 text-lg font-semibold">{label}</ThemedText>
      ) : null}
      <View className="flex-row items-center gap-1.5">
        {Array.from({ length: max }, (_, index) => {
          const filled = index < clamped;
          return (
            <View
              key={index}
              className="h-2.5 flex-1 rounded-full"
              style={{ backgroundColor: filled ? colors.highlight : 'rgba(128,128,128,0.25)' }}
            />
          );
        })}
        <ThemedText className="ml-1 shrink-0 text-xs tabular-nums text-light-subtext dark:text-dark-subtext">
          {clamped}/{max}
        </ThemedText>
      </View>
    </View>
  );
}
