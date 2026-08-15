import React from 'react';
import { Pressable, View } from 'react-native';

import ThemedText from '@/components/ThemedText';

interface SheetNavRowProps {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
  accessibilityLabel?: string;
  /** Volitelná hodnota vpravo na stejném řádku (např. telefon z profilu). */
  detail?: string;
  detailMuted?: boolean;
}

/** List-row v bottom sheetu (Sdílet / kontaktní kanály) — web `siteDrawerNavRow`. */
export default function SheetNavRow({
  label,
  onPress,
  icon,
  accessibilityLabel,
  detail,
  detailMuted = false,
}: SheetNavRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      className="w-full flex-row items-center gap-3 rounded-md px-3 py-2.5 active:bg-light-secondary/50 dark:active:bg-dark-secondary/50">
      <View className="shrink-0">{icon}</View>
      <ThemedText className="min-w-0 shrink text-left text-sm font-medium">{label}</ThemedText>
      {detail ? (
        <ThemedText
          numberOfLines={1}
          className={`min-w-0 flex-1 text-right text-sm ${
            detailMuted
              ? 'text-light-subtext dark:text-dark-subtext'
              : 'font-medium text-light-text dark:text-dark-text'
          }`}>
          {detail}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}
