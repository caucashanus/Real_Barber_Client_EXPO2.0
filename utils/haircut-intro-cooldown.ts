import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@haircut_intro_suppress_until';
const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

/** Po zobrazení úvodu „účes je snadné“ nebo kliknutí na Začít / Jdeme na to – 24 h se skryje karta a přeskočí úvodní stránka. */
export async function setHaircutIntroCooldown24h(): Promise<void> {
  const until = Date.now() + TWENTY_FOUR_H_MS;
  await AsyncStorage.setItem(STORAGE_KEY, String(until)).catch(() => {});
}

export async function isHaircutIntroCooldownActive(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (!raw) return false;
  const until = parseInt(raw, 10);
  if (Number.isNaN(until)) return false;
  if (Date.now() >= until) {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return false;
  }
  return true;
}
