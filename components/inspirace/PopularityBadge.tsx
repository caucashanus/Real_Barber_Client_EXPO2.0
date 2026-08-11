import React from 'react';
import { Text, View } from 'react-native';
import { styled } from 'nativewind';

import AppButton from '@/components/AppButton';
import Icon from '@/components/Icon';
import { useAccentColor } from '@/contexts/AccentColorContext';
import useThemeColors from '@/contexts/ThemeColors';
import { getAppButtonClasses } from '@/constants/buttonVariants';
import {
  NEXT_SLOT_BUTTON_CLASS,
  NEXT_SLOT_BUTTON_COMPACT_CLASS,
  NEXT_SLOT_BUTTON_COMPACT_TEXT_CLASS,
  NEXT_SLOT_BUTTON_TEXT_CLASS,
} from '@/components/SlotTimePill';

const ButtonText = styled(Text);

interface PopularityBadgeProps {
  label: string;
  value: string;
  className?: string;
  textClassName?: string;
  /** Stejná kompaktní varianta jako `RatingBadge`. */
  compact?: boolean;
}

/** Choice chip pro popularitu — stejný globální `AppButton choice` jako `RatingBadge`. */
export default function PopularityBadge({
  label,
  value,
  className,
  textClassName,
  compact = true,
}: PopularityBadgeProps) {
  const { isDark } = useThemeColors();
  const { accentColor } = useAccentColor();
  const size = compact ? 'xs' : 'sm';
  const resolvedTextClassName = [
    compact ? NEXT_SLOT_BUTTON_COMPACT_TEXT_CLASS : NEXT_SLOT_BUTTON_TEXT_CLASS,
    textClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const { text, textStyle } = getAppButtonClasses({
    variant: 'choice',
    size,
    isDark,
    accentColor,
    textClassName: resolvedTextClassName,
  });

  const iconColor = typeof textStyle?.color === 'string' ? textStyle.color : undefined;
  const iconSize = compact ? 14 : 16;

  return (
    <AppButton
      variant="choice"
      size={size}
      disableHaptic
      className={[
        compact ? NEXT_SLOT_BUTTON_COMPACT_CLASS : NEXT_SLOT_BUTTON_CLASS,
        className,
      ]
        .filter(Boolean)
        .join(' ')}>
      <View className="flex-row items-center">
        <ButtonText className={text} style={textStyle}>
          {label}
        </ButtonText>
        <Icon
          name="Flame"
          size={iconSize}
          color={iconColor}
          className={compact ? 'mx-1' : 'mx-1.5'}
        />
        <ButtonText className={`${text} tabular-nums`} style={textStyle}>
          {value}
        </ButtonText>
      </View>
    </AppButton>
  );
}
