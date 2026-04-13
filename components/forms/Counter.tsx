import React, { useState } from 'react';
import { View, Pressable, Text, StyleProp, ViewStyle } from 'react-native';

import ThemedText from '../ThemedText';

interface CounterProps {
  label?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Counter({
  label,
  value: controlledValue,
  onChange,
  min = 0,
  max = 99,
  className,
  style,
}: CounterProps) {
  const [internalValue, setInternalValue] = useState<number | undefined>(undefined);

  // Handle controlled and uncontrolled modes
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue: number | undefined) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const increment = () => {
    if (value === undefined) {
      handleChange(1);
    } else if (value < max) {
      handleChange(value + 1);
    }
  };

  const decrement = () => {
    if (value === 1) {
      handleChange(undefined);
    } else if (value !== undefined && value > min) {
      handleChange(value - 1);
    }
  };

  return (
    <View className={`w-auto ${className}`} style={style}>
      <View className="w-full flex-row items-center justify-between">
        <View className="min-w-[100px] flex-row items-center justify-between overflow-hidden rounded-full bg-light-secondary p-1  dark:bg-dark-secondary">
          <Pressable
            onPress={decrement}
            className="h-8 w-8 items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary">
            <ThemedText className="text-lg">-</ThemedText>
          </Pressable>

          <View className="min-w-[80px] items-center justify-center px-4">
            <ThemedText className="text-base font-medium">
              {value === undefined ? 'any' : value}
            </ThemedText>
          </View>

          <Pressable
            onPress={increment}
            className="h-8 w-8 items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary">
            <ThemedText className="text-lg">+</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
