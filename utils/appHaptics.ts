import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { getHapticFeedbackEnabledSync } from '@/utils/hapticFeedbackPreference';

function runHaptic(fn: () => Promise<void>): void {
  if (!getHapticFeedbackEnabledSync()) return;
  void fn().catch((err) => {
    if (__DEV__) {
      console.warn('[haptics]', err);
    }
  });
}

export function triggerImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium
): void {
  if (Platform.OS === 'web') return;
  runHaptic(() => Haptics.impactAsync(style));
}

export function triggerSelection(): void {
  if (Platform.OS === 'web') return;
  runHaptic(() => Haptics.selectionAsync());
}

export function triggerNotification(type: Haptics.NotificationFeedbackType): void {
  if (Platform.OS === 'web') return;
  runHaptic(() => Haptics.notificationAsync(type));
}
