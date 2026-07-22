import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import AppButton, { type AppButtonRounded, type AppButtonSize } from '@/components/AppButton';
import type { IconName } from '@/components/Icon';

/**
 * Web: `variant="default"`.
 * Pouze CTA Rezervovat / booking submit — nepoužívat pro jiné akce.
 */
interface ReserveButtonProps {
  title: string;
  onPress?: () => void;
  href?: string;
  size?: AppButtonSize;
  rounded?: AppButtonRounded;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  iconStart?: IconName;
  iconEnd?: IconName;
  accessibilityLabel?: string;
}

export default function ReserveButton(props: ReserveButtonProps) {
  return <AppButton variant="default" {...props} />;
}
