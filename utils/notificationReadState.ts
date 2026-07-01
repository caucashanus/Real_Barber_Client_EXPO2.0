import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@rb_notification_read_v1';
const BASELINE_KEY_PREFIX = '@rb_notification_read_baseline_v1';
const MAX_READ_IDS = 500;

function storageKey(clientId: string): string {
  return `${KEY_PREFIX}:${clientId}`;
}

function baselineStorageKey(clientId: string): string {
  return `${BASELINE_KEY_PREFIX}:${clientId}`;
}

/** Local midnight for the given date — used as read-tracking baseline ("from today"). */
export function startOfLocalDayMs(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * First time read tracking runs for a client, store start of that local day.
 * Notifications older than this baseline are treated as already read.
 */
export async function getReadTrackingBaseline(clientId: string): Promise<number> {
  if (!clientId.trim()) return startOfLocalDayMs();

  const key = baselineStorageKey(clientId);
  const raw = await AsyncStorage.getItem(key).catch(() => null);
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const baseline = startOfLocalDayMs();
  await AsyncStorage.setItem(key, String(baseline)).catch(() => {});
  return baseline;
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

export function isNotificationRead(
  readIds: Set<string>,
  notificationId: string,
  createdAtIso?: string | null,
  baselineMs?: number
): boolean {
  const id = notificationId.trim();
  if (!id) return true;
  if (readIds.has(id)) return true;

  if (baselineMs != null && createdAtIso) {
    const created = new Date(createdAtIso).getTime();
    if (Number.isFinite(created) && created < baselineMs) return true;
  }

  return false;
}
