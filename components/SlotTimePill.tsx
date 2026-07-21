import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';

import ThemedText from '@/components/ThemedText';

interface SlotTimePillProps {
  label: string;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

/** Outlined pill for bookable time slots (e.g. 14:00). */
export default function SlotTimePill({
  label,
  onPress,
  className,
  style,
  disabled = false,
}: SlotTimePillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={[{ alignSelf: 'flex-start' }, style]}
      className={`rounded-lg border border-neutral-400 px-2 py-0.5 dark:border-neutral-500 ${className ?? ''}`}>
      <ThemedText className="text-xs font-semibold">{label}</ThemedText>
    </TouchableOpacity>
  );
}
