export function setLiveActivityApiToken(_apiToken: string | null): void {}

export function attachActivityPushTokenRegistration(
  _activity: unknown,
  _bookingId: string
): void {}

export function detachActivityPushTokenRegistration(): void {}

export async function getCachedLiveActivityBookingId(): Promise<string | null> {
  return null;
}

export async function adoptServerLiveActivitiesForBookings(
  _preferredBookingId: string | null
): Promise<void> {}

export async function registerPushToStartTokenWithApi(_token: string): Promise<void> {}

export async function unregisterAllLiveActivityTokens(_apiToken: string): Promise<void> {}
