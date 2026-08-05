import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

interface CopyFeedbackProps {
  message: string;
  duration?: number;
  onHide?: () => void;
  isVisible: boolean;
}

/** Krátké potvrzení po zkopírování — snackbar dole na obrazovce. */
export default function CopyFeedback({
  message,
  duration = 1800,
  onHide,
  isVisible,
}: CopyFeedbackProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVisible) return;

    translateY.setValue(24);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(duration),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 24,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onHide?.();
    });
  }, [duration, isVisible, onHide, opacity, translateY]);

  if (!isVisible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 12) + 12,
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      <View className="flex-row items-center gap-2 rounded-2xl bg-neutral-900/92 px-4 py-3 dark:bg-neutral-100/95">
        <Icon name="Check" size={16} className="text-white dark:text-neutral-900" strokeWidth={2.5} />
        <ThemedText className="text-sm font-medium text-white dark:text-neutral-900">
          {message}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999999,
    alignItems: 'center',
    elevation: 8,
  },
});
