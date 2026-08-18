import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

import { useAccentColor } from '@/contexts/AccentColorContext';
import { hexToRgba } from '@/utils/colorHelpers';

export type SiteLoadingSpinnerSize = 'default' | 'compact';

const SPINNER_PX: Record<SiteLoadingSpinnerSize, number> = {
  default: 32,
  compact: 24,
};

/** Web parity: CSS animate-spin accent ring (border-accent/25 + border-t-accent). */
export default function SiteLoadingSpinner({
  size = 'default',
  className,
}: {
  size?: SiteLoadingSpinnerSize;
  className?: string;
}) {
  const { accentColor } = useAccentColor();
  const spin = useRef(new Animated.Value(0)).current;
  const px = SPINNER_PX[size];
  const accent = accentColor || '#FF4F31';

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        borderWidth: 2,
        borderColor: hexToRgba(accent, 0.25),
        borderTopColor: accent,
        transform: [{ rotate }],
      }}
    />
  );
}
