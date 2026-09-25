import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_BANNER_ID_KEY = '@promo_banner_dismissed_id';

export async function readDismissedPromoBannerId(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(DISMISSED_BANNER_ID_KEY).catch(() => null);
  if (!raw?.trim()) return null;
  return raw.trim();
}

export async function writeDismissedPromoBannerId(bannerId: string): Promise<void> {
  await AsyncStorage.setItem(DISMISSED_BANNER_ID_KEY, bannerId.trim()).catch(() => {});
}
