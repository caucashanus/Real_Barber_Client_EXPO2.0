import { Host, Toggle } from '@expo/ui/swift-ui';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';

import Icon, { IconName } from '../Icon';
import ThemedText from '../ThemedText';

import useThemeColors from '@/contexts/ThemeColors';
import { triggerImpact } from '@/utils/appHaptics';

interface SwitchProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const Switch: React.FC<SwitchProps> = ({
  value,
  onChange,
  label,
  description,
  icon,
  disabled = false,
  className = '',
  style,
}) => {
  const colors = useThemeColors();
  const [isOn, setIsOn] = useState(value ?? false);
  const slideAnim = useRef(new Animated.Value((value ?? false) ? 1 : 0)).current;

  const isControlled = value !== undefined;
  const switchValue = isControlled ? value : isOn;

  const applyChange = (newValue: boolean) => {
    if (disabled) return;

    if (!isControlled) {
      setIsOn(newValue);
    }

    onChange?.(newValue);
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Animated.spring(slideAnim, {
      toValue: switchValue ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [switchValue, slideAnim]);

  const toggleAndroid = () => {
    applyChange(!switchValue);
  };

  const rowClassName = `flex-row items-center py-1 ${disabled ? 'opacity-50' : ''} ${className}`;

  const leading = (
    <>
      {icon ? (
        <View className="mr-3">
          <Icon name={icon} size={20} color={colors.text} />
        </View>
      ) : null}
      {(label || description) ? (
        <View className="flex-1">
          {label ? <ThemedText className="text-base font-medium">{label}</ThemedText> : null}
          {description ? (
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {description}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <View className={rowClassName} style={style} pointerEvents={disabled ? 'none' : 'auto'}>
        {leading}
        <Host matchContents>
          <Toggle isOn={switchValue} onIsOnChange={applyChange} />
        </Host>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggleAndroid}
      disabled={disabled}
      className={rowClassName}
      style={style}>
      {leading}
      <View className="h-6 w-10 rounded-full">
        <View
          style={switchValue ? { backgroundColor: colors.highlight } : undefined}
          className={`absolute h-full w-full rounded-full ${!switchValue ? 'bg-light-surface dark:bg-white/40' : ''}`}
        />
        <Animated.View
          style={{
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1.2],
                  outputRange: [1, 21],
                }),
              },
            ],
          }}
          className="my-0.5 h-5 w-5 rounded-full bg-white shadow-sm dark:bg-white"
        />
      </View>
    </TouchableOpacity>
  );
};

export default Switch;
