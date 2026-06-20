import * as Haptics from 'expo-haptics';
import React, { ReactNode } from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';

import AnimatedView from '../AnimatedView';
import Icon, { IconName } from '../Icon';
import ThemedText from '../ThemedText';

import useThemeColors from '@/app/contexts/ThemeColors';

interface SelectableProps {
  title: string;
  description?: string;
  /** When set, renders below the title instead of {@link description}. */
  descriptionContent?: ReactNode;
  descriptionClassName?: string;
  selectedIndicatorPosition?: 'inline' | 'topRight' | 'bottomRight';
  showSelectedIndicator?: boolean;
  icon?: IconName;
  customIcon?: ReactNode;
  iconColor?: string;
  selected?: boolean;
  onPress?: () => void;
  error?: string;
  className?: string;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * S {@link customIcon}: bez šedého rámečku kolem ikony – vlastní vzhled (např. obrys výběru kolem avatara).
   */
  customIconUnstyled?: boolean;
}

const Selectable: React.FC<SelectableProps> = ({
  title,
  description,
  descriptionContent,
  descriptionClassName = '',
  selectedIndicatorPosition = 'inline',
  showSelectedIndicator = true,
  icon,
  customIcon,
  iconColor,
  selected = false,
  onPress,
  error,
  className = '',
  containerClassName = '',
  style,
  customIconUnstyled = false,
}) => {
  const colors = useThemeColors();
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  const borderStyle: ViewStyle = error
    ? { borderWidth: 2, borderColor: '#ef4444' }
    : selected
      ? { borderWidth: 2, borderColor: colors.highlight }
      : { borderWidth: 1, borderColor: colors.border };

  return (
    <View className={`mb-2 ${containerClassName}`}>
      <Pressable
        onPress={handlePress}
        style={[style, borderStyle]}
        className={`
          relative rounded-2xl p-4 active:opacity-70
          ${selected ? 'bg-light-subtext/0 dark:bg-dark-secondary' : 'dark:bg-dark-secondary/50'}
          ${className}
        `}>
        <View className="flex-row items-center">
          {icon && (
            <View
              style={selected ? { backgroundColor: colors.highlight } : undefined}
              className={`mr-4 h-12 w-12 items-center justify-center rounded-xl bg-light-secondary dark:bg-white/10 ${!selected ? '' : ''}`}>
              <Icon
                name={icon}
                size={20}
                strokeWidth={1.2}
                color={iconColor || (selected ? 'white' : colors.icon)}
              />
            </View>
          )}
          {customIcon &&
            (customIconUnstyled ? (
              <View className="mr-4 justify-center">{customIcon}</View>
            ) : (
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-light-secondary dark:bg-dark-secondary">
                {customIcon}
              </View>
            ))}
          <View className="flex-1">
            <ThemedText className="text-base font-semibold">{title}</ThemedText>
            {descriptionContent ? (
              <View className="mt-1">{descriptionContent}</View>
            ) : description ? (
              <ThemedText
                className={`mt-0 text-sm text-light-subtext dark:text-dark-subtext ${descriptionClassName}`}>
                {description}
              </ThemedText>
            ) : null}
          </View>
          {selected && showSelectedIndicator && selectedIndicatorPosition === 'inline' ? (
            <AnimatedView className="ml-3" animation="bounceIn" duration={500}>
              <Icon name="CheckCircle2" size={24} color={colors.highlight} />
            </AnimatedView>
          ) : null}
        </View>
        {selected && showSelectedIndicator && selectedIndicatorPosition !== 'inline' ? (
          <AnimatedView
            className={
              selectedIndicatorPosition === 'topRight'
                ? 'absolute right-3 top-3'
                : 'absolute bottom-3 right-3'
            }
            animation="bounceIn"
            duration={500}>
            <Icon name="CheckCircle2" size={20} color={colors.highlight} />
          </AnimatedView>
        ) : null}
      </Pressable>

      {error && <ThemedText className="mt-1 text-xs text-red-500">{error}</ThemedText>}
    </View>
  );
};

export default Selectable;
