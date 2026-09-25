/** Fallback store links when CRM mobile-compatibility omits storeUrls. */
export const IOS_APP_STORE_UPDATE_URL = 'https://apps.apple.com/app/id6760221388';

export const ANDROID_PLAY_STORE_UPDATE_URL =
  'https://play.google.com/store/apps/details?id=com.realbarber.client';

export function getStoreUpdateUrl(platform: 'ios' | 'android'): string {
  return platform === 'ios' ? IOS_APP_STORE_UPDATE_URL : ANDROID_PLAY_STORE_UPDATE_URL;
}
