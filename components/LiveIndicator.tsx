import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type LiveIndicatorVariant = 'green' | 'red' | 'orange';

interface LiveIndicatorProps {
  variant?: LiveIndicatorVariant;
  /** 'sm' = 8px, default = 12px, 'lg' = 16px */
  size?: 'sm' | 'default' | 'lg';
  /** When false, no blinking animation (static circle). Default true. */
  animated?: boolean;
}

const LiveIndicator = ({
  variant = 'green',
  size = 'default',
  animated = true,
}: LiveIndicatorProps) => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!animated) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [opacity, animated]);
  const colorClass =
    variant === 'red'
      ? 'bg-gray-400 dark:bg-gray-500'
      : variant === 'orange'
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-emerald-500 dark:bg-emerald-400';
  const sizeClass = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  const className = `rounded-full ${sizeClass} ${colorClass}`;
  if (!animated) {
    return <View className={className} />;
  }
  return <Animated.View style={{ opacity }} className={className} />;
};

export default LiveIndicator;
