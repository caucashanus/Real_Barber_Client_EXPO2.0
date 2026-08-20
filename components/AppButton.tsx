import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { styled } from 'nativewind';

import Icon, { type IconName } from '@/components/Icon';
import { useAccentColor } from '@/contexts/AccentColorContext';
import useThemeColors from '@/contexts/ThemeColors';
import {
  getAppButtonClasses,
  type AppButtonRounded,
  type AppButtonSize,
  type AppButtonSurface,
  type AppButtonVariant,
} from '@/constants/buttonVariants';
import { SOFT_CHIP_LAYOUT } from '@/constants/buttonTokens';
import { triggerImpact } from '@/utils/appHaptics';

export type { AppButtonRounded, AppButtonSize, AppButtonSurface, AppButtonVariant };

const ButtonText = styled(Text);

interface AppButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: (event?: GestureResponderEvent) => void;
  href?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  selected?: boolean;
  surface?: AppButtonSurface;
  rounded?: AppButtonRounded;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  iconStart?: IconName;
  iconEnd?: IconName;
  iconSize?: number;
  iconClassName?: string;
  accessibilityLabel?: string;
  impactFeedbackStyle?: Haptics.ImpactFeedbackStyle;
  disableHaptic?: boolean;
}

export default function AppButton({
  title,
  children,
  onPress,
  href,
  variant = 'default',
  size,
  selected = false,
  surface = 'default',
  rounded,
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  textClassName,
  style,
  iconStart,
  iconEnd,
  iconSize,
  iconClassName = '',
  accessibilityLabel,
  impactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
  disableHaptic = false,
}: AppButtonProps) {
  const { isDark } = useThemeColors();
  const { accentColor } = useAccentColor();
  const isDisabled = disabled || loading;
  const { container, text, containerStyle, textStyle } = getAppButtonClasses({
    variant,
    size,
    selected,
    disabled: isDisabled,
    surface,
    rounded,
    fullWidth,
    isDark,
    accentColor,
    className,
    textClassName,
  });

  const resolvedIconSize =
    iconSize ??
    (variant === 'soft'
      ? SOFT_CHIP_LAYOUT.iconSize
      : size === 'xs' || size === 'icon-sm'
        ? 14
        : size === 'sm'
          ? 16
          : 18);

  const iconColor =
    typeof textStyle?.color === 'string' ? textStyle.color : undefined;

  const triggerHaptic = () => {
    if (disableHaptic || isDisabled) return;
    triggerImpact(impactFeedbackStyle);
  };

  const handlePress = (event: GestureResponderEvent) => {
    triggerHaptic();
    if (href) {
      router.push(href);
      return;
    }
    onPress?.(event);
  };

  const content =
    children ?? (
      <View
        className={`flex-row items-center ${
          variant === 'panel'
            ? 'justify-start gap-3'
            : variant === 'soft'
              ? 'gap-1.5'
              : variant === 'choice'
                ? iconStart || iconEnd
                  ? 'justify-start'
                  : 'justify-center'
                : 'justify-center'
        }`}>
        {iconStart && !loading ? (
          <Icon
            name={iconStart}
            size={resolvedIconSize}
            color={iconColor}
            strokeWidth={variant === 'soft' ? 2 : undefined}
            className={
              variant === 'soft' || variant === 'panel'
                ? iconClassName
                : `${title ? 'mr-2' : ''} ${iconClassName}`.trim()
            }
          />
        ) : null}
        {title ? (
          <ButtonText className={text} style={textStyle}>
            {title}
          </ButtonText>
        ) : null}
        {iconEnd && !loading ? (
          <Icon
            name={iconEnd}
            size={resolvedIconSize}
            color={iconColor}
            className={`ml-2 ${iconClassName}`}
          />
        ) : null}
      </View>
    );

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole={variant === 'link' ? 'link' : 'button'}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: isDisabled,
        selected: variant === 'choice' ? selected : undefined,
      }}
      className={container}
      style={[containerStyle, style]}>
      {content}
    </Pressable>
  );
}

export { getAppButtonClasses, getSoftChipClasses } from '@/constants/buttonVariants';
export { BUTTON_CHOICE, BUTTON_OUTLINE, BUTTON_SOFT, SOFT_CHIP_LAYOUT } from '@/constants/buttonTokens';
