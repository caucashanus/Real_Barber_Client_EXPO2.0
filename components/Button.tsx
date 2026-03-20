// components/Button.tsx
import React from 'react';
import { Text, ActivityIndicator, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import Icon, { IconName } from './Icon';
import useThemeColors from '@/app/contexts/ThemeColors';

type RoundedOption = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  rounded?: RoundedOption;
  href?: string;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  iconSize?: number;
  iconColor?: string;
  iconClassName?: string;
  /** Merged with primary background; use for e.g. custom `backgroundColor`. */
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  size = 'medium',
  rounded = 'lg',
  href,
  className = '',
  textClassName = '',
  disabled = false,
  iconStart,
  iconEnd,
  iconSize,
  iconColor,
  iconClassName = '',
  style: styleFromProps,
  ...restProps
}) => {
  const colors = useThemeColors();
  const buttonStyles = {
    primary: '',
    secondary: 'bg-light-secondary dark:bg-dark-secondary',
    outline: 'border border-black dark:border-white bg-transparent',
    ghost: 'bg-transparent',
  };
  
  const buttonSize = {
    small: 'py-2',
    medium: 'py-3',
    large: 'py-5',
  };
  
  const roundedStyles = {
    none: 'rounded-none',
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };
  
  const textColor = 'text-black dark:text-white';
  const disabledStyle = disabled ? 'opacity-50' : '';

  // Default icon sizes based on button size
  const getIconSize = () => {
    if (iconSize) return iconSize;
    
    switch (size) {
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 20;
      default: return 18;
    }
  };

  // Default icon color based on variant
  const getIconColor = () => {
    if (iconColor) return iconColor;
    
    // return variant === 'outline' || variant === 'secondary' || variant === 'ghost' 
    //   ? '#000000' // highlight color
    //   : '#FFFFFF'; // white
  };

  const ButtonContent = (
    <>
      {loading ? (
        <View className="w-full items-center justify-center py-0.5">
          <ActivityIndicator color={variant === 'primary' ? (colors.isDark ? '#fff' : '#000') : '#0EA5E9'} />
        </View>
      ) : (
        <View className="w-full flex-row items-center justify-center px-0">
          {iconStart && (
            <Icon 
              name={iconStart} 
              size={getIconSize()} 
              color={getIconColor()} 
              className={`mr-2 shrink-0 ${iconClassName} `} 
            />
          )}
          
          <Text className={`${textColor} font-medium text-center shrink ${textClassName}`}>{title}</Text>
          
          {iconEnd && (
            <Icon 
              name={iconEnd} 
              size={getIconSize()} 
              color={getIconColor()} 
              className={`ml-2 shrink-0 ${iconClassName}`} 
            />
          )}
        </View>
      )}
    </>
  );

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const primaryStyle = variant === 'primary' ? { backgroundColor: colors.highlight } : undefined;
  const mergedStyle = [primaryStyle, styleFromProps].filter(Boolean);

  if (href) {
    return (
      <TouchableOpacity
        disabled={loading || disabled}
        activeOpacity={0.8}
        style={mergedStyle.length ? mergedStyle : undefined}
        className={`px-4 relative ${buttonStyles[variant]} ${buttonSize[size]} ${roundedStyles[rounded]} items-center justify-center ${disabledStyle} ${className}`}
        {...restProps}
        onPress={() => {
          triggerHaptic();
          router.push(href);
        }}
      >
        {ButtonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        onPress?.();
      }}
      disabled={loading || disabled}
      activeOpacity={0.8}
      style={mergedStyle.length ? mergedStyle : undefined}
      className={`px-4 relative ${buttonStyles[variant]} ${buttonSize[size]} ${roundedStyles[rounded]} items-center justify-center ${disabledStyle} ${className}`}
      {...restProps}
    >
      {ButtonContent}
    </TouchableOpacity>
  );
};
