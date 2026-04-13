import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setCooldownMs(storageKey: string, ms: number): Promise<void> {
  const until = Date.now() + ms;
  await AsyncStorage.setItem(storageKey, String(until)).catch(() => {});
}

export async function isCooldownActive(storageKey: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(storageKey).catch(() => null);
  if (!raw) return false;
  const until = parseInt(raw, 10);
  if (Number.isNaN(until)) return false;
  if (Date.now() >= until) {
    await AsyncStorage.removeItem(storageKey).catch(() => {});
    return false;
  }
  return true;
}
