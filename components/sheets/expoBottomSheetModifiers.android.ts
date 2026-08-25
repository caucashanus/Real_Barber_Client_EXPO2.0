import { background } from '@expo/ui/jetpack-compose/modifiers';

import type { ModifierConfig } from '@expo/ui/jetpack-compose/modifiers';

export function createExpoSheetModifiers(backgroundColor: string): ModifierConfig[] {
  return [background(backgroundColor)];
}
