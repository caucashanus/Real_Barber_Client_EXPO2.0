import * as Haptics from 'expo-haptics';

import { getHapticFeedbackEnabledSync } from '@/utils/hapticFeedbackPreference';

export function triggerImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium
): void {
  if (!getHapticFeedbackEnabledSync()) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function triggerSelection(): void {
  if (!getHapticFeedbackEnabledSync()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function triggerNotification(type: Haptics.NotificationFeedbackType): void {
  if (!getHapticFeedbackEnabledSync()) return;
  Haptics.notificationAsync(type).catch(() => {});
}
