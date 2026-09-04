import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import type { LiveActivity } from 'expo-widgets';

import {
  registerActivityKitPushToken,
  registerPushToStartToken,
  unregisterLiveActivityToken,
} from '@/api/liveActivityPush';
import BookingActivity from '@/widgets/BookingActivity';

const PUSH_DEVICE_ID_KEY = '@push_device_id';
const PUSH_TO_START_TOKEN_KEY = '@live_activity_push_to_start_token';
const ACTIVITY_KIT_TOKEN_KEY = '@live_activity_activitykit_token';

const C1_REGISTER_RETRY_DELAYS_MS = [0, 1_000, 3_000, 6_000, 10_000] as const;
const C1_POST_MAX_ATTEMPTS = 3;

let currentApiToken: string | null = null;
let lastRegisteredActivityId: string | null = null;
let lastActivityKitRegistrationKey: string | null = null;
let lastPushToStartRegistrationKey: string | null = null;

type ActivityRegistration = {
  subscription: EventSubscription;
  bookingId: string;
  activityId: string | null;
};

const activityRegistrations = new Map<LiveActivity<unknown>, ActivityRegistration>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logLiveActivity(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.log(`[live-activity] ${message}`, detail);
    return;
  }
  console.log(`[live-activity] ${message}`);
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(PUSH_DEVICE_ID_KEY).catch(() => null);
  if (existing) return existing;
  const created = `rb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(PUSH_DEVICE_ID_KEY, created).catch(() => {});
  return created;
}

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export function setLiveActivityApiToken(apiToken: string | null): void {
  currentApiToken = apiToken;
  if (!apiToken) {
    detachActivityPushTokenRegistration();
    lastRegisteredActivityId = null;
    lastActivityKitRegistrationKey = null;
  }
}

export function detachActivityPushTokenRegistration(): void {
  for (const { subscription } of activityRegistrations.values()) {
    subscription.remove();
  }
  activityRegistrations.clear();
}

/** Poslední bookingId registrovaný k běžící Live Activity (persist přes restart app). */
export async function getCachedLiveActivityBookingId(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(ACTIVITY_KIT_TOKEN_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { bookingId?: string };
    const id = parsed.bookingId?.trim();
    return id || null;
  } catch {
    return null;
  }
}

async function postActivityKitTokenOnce(
  bookingId: string,
  activityId: string,
  pushToken: string
): Promise<void> {
  if (!currentApiToken || !pushToken.trim() || !activityId.trim() || !bookingId.trim()) return;

  const registrationKey = `${activityId}:${pushToken}:${bookingId}`;
  if (lastActivityKitRegistrationKey === registrationKey) return;

  const deviceId = await getOrCreateDeviceId();
  await registerActivityKitPushToken(currentApiToken, {
    bookingId,
    activityId,
    pushToken,
    deviceId,
    appVersion: getAppVersion(),
  });

  lastActivityKitRegistrationKey = registrationKey;
  lastRegisteredActivityId = activityId;
  await AsyncStorage.setItem(
    ACTIVITY_KIT_TOKEN_KEY,
    JSON.stringify({ activityId, pushToken, bookingId })
  ).catch(() => {});

  logLiveActivity('C1 register ok', { bookingId, activityId });
}

async function postActivityKitTokenWithRetry(
  bookingId: string,
  activityId: string,
  pushToken: string
): Promise<void> {
  for (let attempt = 0; attempt < C1_POST_MAX_ATTEMPTS; attempt += 1) {
    try {
      await postActivityKitTokenOnce(bookingId, activityId, pushToken);
      return;
    } catch (error) {
      const isLast = attempt === C1_POST_MAX_ATTEMPTS - 1;
      if (isLast) {
        console.warn('[live-activity] C1 register failed', { bookingId, activityId, error });
        return;
      }
      await sleep(500 * (attempt + 1));
    }
  }
}

function rememberActivityId(activity: LiveActivity<unknown>, activityId: string): void {
  const registration = activityRegistrations.get(activity);
  if (!registration) return;
  registration.activityId = activityId;
}

async function pollActivityPushToken(
  activity: LiveActivity<unknown>,
  bookingId: string
): Promise<void> {
  for (const delayMs of C1_REGISTER_RETRY_DELAYS_MS) {
    if (delayMs > 0) await sleep(delayMs);
    if (!currentApiToken) return;

    const registration = activityRegistrations.get(activity);
    if (!registration) return;

    try {
      const pushToken = await activity.getPushToken();
      if (!pushToken?.trim()) continue;

      const activityId =
        registration.activityId ??
        lastRegisteredActivityId ??
        (await (async () => {
          const raw = await AsyncStorage.getItem(ACTIVITY_KIT_TOKEN_KEY).catch(() => null);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw) as { activityId?: string; bookingId?: string };
            return parsed.bookingId === bookingId ? parsed.activityId?.trim() ?? null : null;
          } catch {
            return null;
          }
        })());

      if (!activityId) continue;

      await postActivityKitTokenWithRetry(bookingId, activityId, pushToken);
      return;
    } catch {
      // keep polling until delays exhausted
    }
  }
}

function ensureActivityRegistration(activity: LiveActivity<unknown>, bookingId: string): void {
  const normalizedBookingId = bookingId.trim();
  if (!normalizedBookingId) return;

  const existing = activityRegistrations.get(activity);
  if (existing?.bookingId === normalizedBookingId) {
    void pollActivityPushToken(activity, normalizedBookingId);
    return;
  }

  existing?.subscription.remove();

  const subscription = activity.addPushTokenListener(({ activityId, pushToken }) => {
    rememberActivityId(activity, activityId);
    void postActivityKitTokenWithRetry(normalizedBookingId, activityId, pushToken);
  });

  activityRegistrations.set(activity, {
    subscription,
    bookingId: normalizedBookingId,
    activityId: null,
  });

  void pollActivityPushToken(activity, normalizedBookingId);
}

async function resolveBookingIdForAdoption(preferredBookingId: string | null): Promise<string | null> {
  const preferred = preferredBookingId?.trim();
  if (preferred) return preferred;
  return getCachedLiveActivityBookingId();
}

/**
 * Adoptuje CRM-spuštěné Live Activity instance a registruje C1 (ActivityKit update token).
 * Volat po načtení bookings, při návratu app do popředí a po CRM C2 push-to-start.
 */
export async function adoptServerLiveActivitiesForBookings(
  preferredBookingId: string | null
): Promise<void> {
  if (!currentApiToken) return;

  const bookingId = await resolveBookingIdForAdoption(preferredBookingId);
  if (!bookingId) return;

  const instances = BookingActivity.getInstances();
  if (instances.length === 0) return;

  if (instances.length > 1) {
    logLiveActivity('multiple LA instances — adopting all with same bookingId', {
      count: instances.length,
      bookingId,
    });
  }

  for (const instance of instances) {
    ensureActivityRegistration(instance, bookingId);
  }
}

/** @deprecated Server-only — použij adoptServerLiveActivitiesForBookings. */
export function attachActivityPushTokenRegistration(
  activity: LiveActivity<unknown>,
  bookingId: string
): void {
  ensureActivityRegistration(activity, bookingId);
}

export async function registerPushToStartTokenWithApi(token: string): Promise<void> {
  if (!currentApiToken || !token.trim()) return;

  const registrationKey = token.trim();
  if (lastPushToStartRegistrationKey === registrationKey) return;

  const cached = await AsyncStorage.getItem(PUSH_TO_START_TOKEN_KEY).catch(() => null);
  if (cached === registrationKey) {
    lastPushToStartRegistrationKey = registrationKey;
    return;
  }

  const deviceId = await getOrCreateDeviceId();

  for (let attempt = 0; attempt < C1_POST_MAX_ATTEMPTS; attempt += 1) {
    try {
      await registerPushToStartToken(currentApiToken, {
        pushToken: registrationKey,
        deviceId,
        appVersion: getAppVersion(),
      });
      lastPushToStartRegistrationKey = registrationKey;
      await AsyncStorage.setItem(PUSH_TO_START_TOKEN_KEY, registrationKey).catch(() => {});
      logLiveActivity('C2 register ok');
      return;
    } catch (error) {
      if (attempt === C1_POST_MAX_ATTEMPTS - 1) {
        console.warn('[live-activity] C2 register failed', error);
      } else {
        await sleep(500 * (attempt + 1));
      }
    }
  }
}

export async function unregisterAllLiveActivityTokens(apiToken: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const cachedActivityRaw = await AsyncStorage.getItem(ACTIVITY_KIT_TOKEN_KEY).catch(() => null);
  const cachedActivity =
    cachedActivityRaw && typeof cachedActivityRaw === 'string'
      ? (() => {
          try {
            return JSON.parse(cachedActivityRaw) as { activityId?: string };
          } catch {
            return null;
          }
        })()
      : null;

  const activityId = lastRegisteredActivityId ?? cachedActivity?.activityId;
  const payload: { activityId?: string; pushToStart: boolean; deviceId: string } = {
    pushToStart: true,
    deviceId,
  };
  if (activityId) payload.activityId = activityId;

  try {
    await unregisterLiveActivityToken(apiToken, payload);
    logLiveActivity('C3 unregister ok');
  } catch (error) {
    console.warn('[live-activity] C3 unregister failed', error);
  } finally {
    detachActivityPushTokenRegistration();
    lastRegisteredActivityId = null;
    lastActivityKitRegistrationKey = null;
    lastPushToStartRegistrationKey = null;
    await AsyncStorage.multiRemove([PUSH_TO_START_TOKEN_KEY, ACTIVITY_KIT_TOKEN_KEY]).catch(() => {});
  }
}
