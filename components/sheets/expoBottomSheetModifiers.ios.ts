import { presentationBackground } from '@expo/ui/swift-ui/modifiers';

import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

export function createExpoSheetModifiers(backgroundColor: string): ModifierConfig[] {
  return [presentationBackground(backgroundColor)];
}
