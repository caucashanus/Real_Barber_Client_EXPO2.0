import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@rb_notification_read_v1';
const MAX_READ_IDS = 500;

function storageKey(clientId: string): string {
  return `${KEY_PREFIX}:${clientId}`;
}

export async function loadReadNotificationIds(clientId: string): Promise<Set<string>> {
  if (!clientId.trim()) return new Set();

  const raw = await AsyncStorage.getItem(storageKey(clientId)).catch(() => null);
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0));
  } catch {
    return new Set();
  }
}

export async function markNotificationRead(
  clientId: string,
  notificationId: string
): Promise<Set<string>> {
  const id = notificationId.trim();
  if (!clientId.trim() || !id) return new Set();

  const current = await loadReadNotificationIds(clientId);
  if (current.has(id)) return current;

  current.add(id);
  const ids = Array.from(current);
  const trimmed = ids.length > MAX_READ_IDS ? ids.slice(ids.length - MAX_READ_IDS) : ids;

  await AsyncStorage.setItem(storageKey(clientId), JSON.stringify(trimmed)).catch(() => {});
  return new Set(trimmed);
}

export function isNotificationRead(readIds: Set<string>, notificationId: string): boolean {
  return readIds.has(notificationId.trim());
}
