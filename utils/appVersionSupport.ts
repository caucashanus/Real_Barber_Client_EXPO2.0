import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getMinimumNativeVersion } from '@/constants/appVersionPolicy';
import { isAppVersionAtLeast } from '@/utils/compareAppVersions';

export function getInstalledNativeAppVersion(): string {
  return (
    Constants.nativeAppVersion?.trim() ||
    Constants.expoConfig?.version?.trim() ||
    '0.0.0'
  );
}

/** Production builds below the platform minimum must update from the store. */
export function isNativeAppVersionSupported(): boolean {
  if (__DEV__) return true;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return true;

  const current = getInstalledNativeAppVersion();
  const minimum = getMinimumNativeVersion(Platform.OS);
  return isAppVersionAtLeast(current, minimum);
}
