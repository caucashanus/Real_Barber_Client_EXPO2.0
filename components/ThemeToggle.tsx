import { useTheme } from 'app/contexts/ThemeContext';
import React, { useState, useRef, useEffect } from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';

import Icon from './Icon';

import useThemeColors from '@/app/contexts/ThemeColors';

interface ThemeToggleProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ value, onChange, className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();

  // Use controlled or uncontrolled mode
  const isControlled = value !== undefined;
  const isActive = isControlled ? value : isDark;

  // Create animation value - initialize based on current state
  const slideAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  // Update animation when theme changes - simplified approach
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive, slideAnim]);

  const handlePress = () => {
    // Handle controlled or uncontrolled mode
    if (isControlled && onChange) {
      onChange(!value);
    } else if (!isControlled) {
      toggleTheme();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      className={`flex-row items-center py-1 ${className}`}>
      <View className="h-10 w-20 flex-row items-center justify-between rounded-full">
        <View className="absolute h-full w-full rounded-full bg-light-secondary dark:bg-dark-secondary" />

        {/* Sun icon on left */}
        <View className="z-10 ml-1 h-8 w-8 items-center justify-center">
          <Icon name="Sun" size={16} color={isActive ? colors.placeholder : colors.text} />
        </View>

        {/* Moon icon on right */}
        <View className="z-10 mr-1 h-8 w-8 items-center justify-center">
          <Icon name="Moon" size={16} color={!isActive ? colors.placeholder : colors.text} />
        </View>

        {/* Animated thumb */}
        <Animated.View
          style={{
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 43], // Move from left (1px) to right (41px)
                }),
              },
            ],
            position: 'absolute',
            top: 4,
          }}
          className="h-8 w-8 rounded-full bg-white shadow-sm dark:bg-dark-primary"
        />
      </View>
    </TouchableOpacity>
  );
};

export default ThemeToggle;
