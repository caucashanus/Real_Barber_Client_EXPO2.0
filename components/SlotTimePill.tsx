import React from 'react';
import type { ViewStyle } from 'react-native';

import AppButton, { type AppButtonSurface } from '@/components/AppButton';

interface SlotTimePillProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  surface?: AppButtonSurface;
  className?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

/** Compact choice button for bookable slot times (e.g. 14:00). */
export default function SlotTimePill({
  label,
  onPress,
  selected = false,
  surface = 'default',
  className,
  style,
  disabled = false,
}: SlotTimePillProps) {
  return (
    <AppButton
      variant="choice"
      size="xs"
      title={label}
      onPress={onPress}
      selected={selected}
      surface={surface}
      disabled={disabled}
      disableHaptic
      className={className ?? ''}
      style={style}
    />
  );
}
