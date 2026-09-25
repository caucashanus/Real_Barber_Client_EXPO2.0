import { Platform } from 'react-native';

import { getInstalledNativeAppVersion } from '@/utils/appVersionSupport';

export function getClientAppPlatformParam(): 'ios' | 'android' | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
}

export function buildClientAppAnalyticsQueryString(): string {
  const platform = getClientAppPlatformParam();
  if (!platform) return '';
  const search = new URLSearchParams({
    platform,
    installedVersion: getInstalledNativeAppVersion(),
  });
  return search.toString();
}
