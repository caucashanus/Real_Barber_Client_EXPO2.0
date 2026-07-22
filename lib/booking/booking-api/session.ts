import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@rb-booking-session-id';

let cachedSessionId: string | null = null;

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getBookingSessionIdAsync(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  const stored = await AsyncStorage.getItem(SESSION_KEY).catch(() => null);
  if (stored) {
    cachedSessionId = stored;
    return stored;
  }
  const id = generateUuid();
  cachedSessionId = id;
  await AsyncStorage.setItem(SESSION_KEY, id).catch(() => {});
  return id;
}

/** Sync accessor — uses cached value or generates ephemeral id until async init completes. */
export function getBookingSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  const id = generateUuid();
  cachedSessionId = id;
  void AsyncStorage.setItem(SESSION_KEY, id).catch(() => {});
  return id;
}

export async function ensureBookingSessionId(): Promise<string> {
  return getBookingSessionIdAsync();
}
