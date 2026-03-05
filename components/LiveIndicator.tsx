import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type LiveIndicatorVariant = 'green' | 'red';

interface LiveIndicatorProps {
  variant?: LiveIndicatorVariant;
  /** 'sm' = 8px, default = 12px */
  size?: 'sm' | 'default';
  /** When false, no blinking animation (static circle). Default true. */
  animated?: boolean;
}

const LiveIndicator = ({ variant = 'green', size = 'default', animated = true }: LiveIndicatorProps) => {
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
  const colorClass = variant === 'red'
    ? 'bg-red-500 dark:bg-red-400'
    : 'bg-green-500 dark:bg-green-400';
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const className = `rounded-full ${sizeClass} ${colorClass}`;
  if (!animated) {
    return <View className={className} />;
  }
  return (
    <Animated.View
      style={{ opacity }}
      className={className}
    />
  );
};

export default LiveIndicator;
