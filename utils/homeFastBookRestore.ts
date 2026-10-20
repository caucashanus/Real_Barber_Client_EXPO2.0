import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HomeFastBookServiceId } from '@/constants/homeFastBookServices';
import type { HomeFastBookWhenChoice } from '@/constants/homeFastBookWhenOptions';

export type { HomeFastBookWhenChoice };

const STORAGE_KEY = '@home-fast-book-restore-v1';

export type HomeFastBookRestorePayload = {
  v: 1;
  selectedServiceId: HomeFastBookServiceId;
  selectedSlotKey: string;
  whenChoice: HomeFastBookWhenChoice;
};

export async function saveHomeFastBookRestore(
  payload: Omit<HomeFastBookRestorePayload, 'v'>
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ v: 1, ...payload } satisfies HomeFastBookRestorePayload)
  ).catch(() => {});
}

export async function consumeHomeFastBookRestore(): Promise<HomeFastBookRestorePayload | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (!raw) return null;
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  try {
    const parsed = JSON.parse(raw) as HomeFastBookRestorePayload;
    if (parsed?.v !== 1 || !parsed.selectedServiceId || !parsed.selectedSlotKey) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearHomeFastBookRestore(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
