import React, { ReactNode } from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import ThemedText from '../ThemedText';
import Icon, { IconName } from '../Icon';
import useThemeColors from '@/app/contexts/ThemeColors';
import AnimatedView from '../AnimatedView';

interface SelectableProps {
  title: string;
  description?: string;
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
}

const Selectable: React.FC<SelectableProps> = ({
  title,
  description,
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
}) => {
  const colors = useThemeColors();

  return (
    <View className={`mb-2 ${containerClassName}`} >
      <Pressable
        onPress={onPress}
        style={style}
        style={selected ? { borderColor: colors.highlight } : undefined}
        className={`
          relative border  dark:border-transparent rounded-2xl p-4 active:opacity-70 y dark:bg-dark-secondary/50
          ${selected ? ' bg-light-subtext/0 dark:bg-dark-secondary' : ' border-neutral-400 dark:border-transparent'}
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      >
        <View className="flex-row items-center">
          {icon && (
            <View style={selected ? { backgroundColor: colors.highlight } : undefined} className={`mr-4 h-12 w-12 rounded-xl items-center justify-center bg-light-secondary dark:bg-white/10 ${!selected ? '' : ''}`}>
              <Icon 
                name={icon} 
                size={20} 
                strokeWidth={1.2}
                color={iconColor || (selected ? "white" : colors.icon)}
              />
            </View>
          )}
          {customIcon && (
            <View className="mr-4 h-12 w-12 rounded-xl items-center justify-center bg-light-secondary dark:bg-dark-secondary">
              {customIcon}
            </View>
          )}
          <View className="flex-1">
            <ThemedText className="font-semibold text-base">
              {title}
            </ThemedText>
            {description && (
              <ThemedText className={`text-sm text-light-subtext dark:text-dark-subtext mt-0 ${descriptionClassName}`}>
                {description}
              </ThemedText>
            )}
          </View>
          {selected && showSelectedIndicator && selectedIndicatorPosition === 'inline' ? (
            <AnimatedView className="ml-3" animation="bounceIn" duration={500}>
              <Icon 
                name="CheckCircle2" 
                size={24} 
                color={colors.highlight}
              />
            </AnimatedView>
          ) : null}
        </View>
        {selected && showSelectedIndicator && selectedIndicatorPosition !== 'inline' ? (
          <AnimatedView
            className={
              selectedIndicatorPosition === 'topRight'
                ? 'absolute top-3 right-3'
                : 'absolute bottom-3 right-3'
            }
            animation="bounceIn"
            duration={500}
          >
            <Icon
              name="CheckCircle2"
              size={20}
              color={colors.highlight}
            />
          </AnimatedView>
        ) : null}
      </Pressable>

      {error && (
        <ThemedText className="text-red-500 text-xs mt-1">
          {error}
        </ThemedText>
      )}
    </View>
  );
};

export default Selectable; 