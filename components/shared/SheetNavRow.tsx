import React from 'react';
import { Pressable, View } from 'react-native';

import ThemedText from '@/components/ThemedText';

interface SheetNavRowProps {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
  accessibilityLabel?: string;
}

/** List-row v bottom sheetu (Sdílet / kontaktní kanály) — web `siteDrawerNavRow`. */
export default function SheetNavRow({
  label,
  onPress,
  icon,
  accessibilityLabel,
}: SheetNavRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      className="w-full flex-row items-center gap-3 rounded-md px-3 py-2.5 active:bg-light-secondary/50 dark:active:bg-dark-secondary/50">
      <View className="shrink-0">{icon}</View>
      <ThemedText className="min-w-0 flex-1 text-left text-sm font-medium">{label}</ThemedText>
    </Pressable>
  );
}
