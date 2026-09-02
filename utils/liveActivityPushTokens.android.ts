import type { LiveActivity } from 'expo-widgets';

export function setLiveActivityApiToken(_apiToken: string | null): void {}

export function attachActivityPushTokenRegistration(
  _activity: LiveActivity<unknown>,
  _bookingId: string
): void {}

export function detachActivityPushTokenRegistration(): void {}

export async function unregisterAllLiveActivityTokens(_apiToken: string): Promise<void> {}
