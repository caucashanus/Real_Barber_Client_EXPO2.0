import { Link } from 'expo-router';
import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

import useThemeColors from '@/app/contexts/ThemeColors';

type AccentChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AccentChipRounded = 'full' | 'xl' | 'lg' | 'md';

interface AccentChipProps {
  label: string;
  size?: AccentChipSize;
  rounded?: AccentChipRounded;
  className?: string;
  style?: ViewStyle;
  onPress?: () => void;
  href?: string;
}

const sizeClasses: Record<AccentChipSize, string> = {
  xs: 'px-2 py-0.5',
  sm: 'px-2.5 py-1',
  md: 'px-3 py-1',
  lg: 'px-4 py-1.5',
  xl: 'px-5 py-2',
};

const textSizeClasses: Record<AccentChipSize, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const roundedClasses: Record<AccentChipRounded, string> = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  lg: 'rounded-lg',
  md: 'rounded-md',
};

export function AccentChip({
  label,
  size = 'md',
  rounded = 'full',
  className = '',
  style,
  onPress,
  href,
}: AccentChipProps) {
  const colors = useThemeColors();

  const chipContent = (
    <Text className={`font-medium ${textSizeClasses[size]}`} style={{ color: colors.highlight }}>
      {label}
    </Text>
  );

  const chipWrapper = (children: ReactNode) => (
    <View className={className} style={style}>
      <View
        className={`${sizeClasses[size]} ${roundedClasses[rounded]} flex-row items-center justify-center bg-black`}>
        {children}
      </View>
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity activeOpacity={0.7}>{chipWrapper(chipContent)}</TouchableOpacity>
      </Link>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {chipWrapper(chipContent)}
      </TouchableOpacity>
    );
  }

  return chipWrapper(chipContent);
}
