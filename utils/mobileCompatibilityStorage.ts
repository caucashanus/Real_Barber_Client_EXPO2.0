import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MobileCompatibilityPolicy } from '@/api/mobileCompatibility';
import { parseMobileCompatibilityPolicy } from '@/api/mobileCompatibility';

const STORAGE_KEY = '@mobile_compatibility_policy';

export async function readCachedMobileCompatibilityPolicy(): Promise<MobileCompatibilityPolicy | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (!raw) return null;
  try {
    return parseMobileCompatibilityPolicy(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeCachedMobileCompatibilityPolicy(
  policy: MobileCompatibilityPolicy
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(policy)).catch(() => {});
}
