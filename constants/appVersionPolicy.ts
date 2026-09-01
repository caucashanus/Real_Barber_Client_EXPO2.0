/** Minimum supported native app version (semver). Older production builds are blocked at launch. */
export const MIN_IOS_NATIVE_VERSION = '2.0.3';
export const MIN_ANDROID_NATIVE_VERSION = '2.0.3';

export const IOS_APP_STORE_UPDATE_URL = 'https://apps.apple.com/app/id6760221388';

export const ANDROID_PLAY_STORE_UPDATE_URL =
  'https://play.google.com/store/apps/details?id=com.realbarber.client';

export function getStoreUpdateUrl(platform: 'ios' | 'android'): string {
  return platform === 'ios' ? IOS_APP_STORE_UPDATE_URL : ANDROID_PLAY_STORE_UPDATE_URL;
}

export function getMinimumNativeVersion(platform: 'ios' | 'android'): string {
  return platform === 'ios' ? MIN_IOS_NATIVE_VERSION : MIN_ANDROID_NATIVE_VERSION;
}
