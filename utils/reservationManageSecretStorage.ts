import * as SecureStore from 'expo-secure-store';

/** SecureStore keys: jen [A-Za-z0-9._-] — bez `:`. */
const KEY_PREFIX = 'rb_manage_secret_';

function storageKey(reservationId: string): string {
  return `${KEY_PREFIX}${reservationId.trim()}`;
}

export async function persistManageSecret(
  reservationId: string,
  secret: string
): Promise<void> {
  const trimmed = secret.trim();
  if (!trimmed) return;
  await SecureStore.setItemAsync(storageKey(reservationId), trimmed, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function readManageSecret(reservationId: string): Promise<string | null> {
  const value = await SecureStore.getItemAsync(storageKey(reservationId));
  return value?.trim() || null;
}

export async function clearManageSecret(reservationId: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey(reservationId));
}
