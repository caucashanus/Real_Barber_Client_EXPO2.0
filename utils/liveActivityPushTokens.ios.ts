import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import type { LiveActivity } from 'expo-widgets';

import {
  registerActivityKitPushToken,
  registerPushToStartToken,
  unregisterLiveActivityToken,
} from '@/api/liveActivityPush';
import type { BookingActivityProps } from '@/utils/bookingLiveActivityData';
import BookingActivity from '@/widgets/BookingActivity';

type BookingLiveActivity = LiveActivity<BookingActivityProps>;

const PUSH_DEVICE_ID_KEY = '@push_device_id';
const PUSH_TO_START_TOKEN_KEY = '@live_activity_push_to_start_token';
const ACTIVITY_KIT_TOKEN_KEY = '@live_activity_activitykit_token';

const C1_REGISTER_RETRY_DELAYS_MS = [
  0, 1_000, 2_000, 4_000, 8_000, 15_000, 20_000, 30_000, 45_000,
] as const;
const C1_POST_MAX_ATTEMPTS = 3;
const C2_ADOPT_DELAYS_MS = [2_000, 5_000, 10_000] as const;

let currentApiToken: string | null = null;
let lastRegisteredActivityId: string | null = null;
let lastActivityKitRegistrationKey: string | null = null;
let lastPushToStartRegistrationKey: string | null = null;

type ActivityRegistration = {
  subscription: EventSubscription;
  bookingId: string;
  activity: BookingLiveActivity;
};

const activityRegistrations = new Map<string, ActivityRegistration>();
const registeredC1ActivityIds = new Set<string>();
const pollingActivityIds = new Set<string>();
const c2AdoptTimeouts = new Set<ReturnType<typeof setTimeout>>();

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

function getActivityId(activity: BookingLiveActivity): string {
  return activity.getId().trim();
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

function clearC2AdoptTimeouts(): void {
  for (const timeoutId of c2AdoptTimeouts) {
    clearTimeout(timeoutId);
  }
  c2AdoptTimeouts.clear();
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
  clearC2AdoptTimeouts();
  for (const { subscription } of activityRegistrations.values()) {
    subscription.remove();
  }
  activityRegistrations.clear();
  registeredC1ActivityIds.clear();
  pollingActivityIds.clear();
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

async function getBookingIdFromActivityProps(
  activity: BookingLiveActivity
): Promise<string | null> {
  try {
    const raw = await activity.getContentProps();
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as Pick<BookingActivityProps, 'bookingId'>;
    const id = parsed.bookingId?.trim();
    return id || null;
  } catch {
    return null;
  }
}

async function resolveBookingIdForInstance(
  activity: BookingLiveActivity,
  preferredBookingId: string | null
): Promise<string | null> {
  const preferred = preferredBookingId?.trim();
  if (preferred) return preferred;

  const fromProps = await getBookingIdFromActivityProps(activity);
  if (fromProps) return fromProps;

  return getCachedLiveActivityBookingId();
}

async function postActivityKitTokenOnce(
  bookingId: string,
  activityId: string,
  pushToken: string
): Promise<void> {
  if (!currentApiToken || !pushToken.trim() || !activityId.trim() || !bookingId.trim()) return;

  const registrationKey = `${activityId}:${pushToken}:${bookingId}`;
  if (lastActivityKitRegistrationKey === registrationKey) {
    registeredC1ActivityIds.add(activityId);
    return;
  }

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
  registeredC1ActivityIds.add(activityId);
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

async function pollActivityPushToken(
  activity: BookingLiveActivity,
  activityId: string,
  bookingId: string
): Promise<void> {
  if (registeredC1ActivityIds.has(activityId)) return;

  for (const delayMs of C1_REGISTER_RETRY_DELAYS_MS) {
    if (delayMs > 0) await sleep(delayMs);
    if (!currentApiToken) return;
    if (registeredC1ActivityIds.has(activityId)) return;
    if (!activityRegistrations.has(activityId)) return;

    try {
      const pushToken = await activity.getPushToken();
      if (!pushToken?.trim()) continue;

      await postActivityKitTokenWithRetry(bookingId, activityId, pushToken);
      return;
    } catch (error) {
      logLiveActivity('C1 poll error', { bookingId, activityId, error });
    }
  }

  logLiveActivity('C1 poll exhausted', { bookingId, activityId });
}

function schedulePoll(
  activity: BookingLiveActivity,
  activityId: string,
  bookingId: string
): void {
  if (registeredC1ActivityIds.has(activityId)) return;
  if (pollingActivityIds.has(activityId)) return;

  pollingActivityIds.add(activityId);
  void pollActivityPushToken(activity, activityId, bookingId).finally(() => {
    pollingActivityIds.delete(activityId);
  });
}

function ensureActivityRegistration(activity: BookingLiveActivity, bookingId: string): void {
  const normalizedBookingId = bookingId.trim();
  if (!normalizedBookingId) return;

  const activityId = getActivityId(activity);
  if (!activityId) return;

  const existing = activityRegistrations.get(activityId);
  if (existing) {
    existing.bookingId = normalizedBookingId;
    existing.activity = activity;
    if (!registeredC1ActivityIds.has(activityId)) {
      schedulePoll(activity, activityId, normalizedBookingId);
    }
    return;
  }

  const subscription = activity.addPushTokenListener(({ activityId: eventActivityId, pushToken }) => {
    void postActivityKitTokenWithRetry(normalizedBookingId, eventActivityId, pushToken);
  });

  activityRegistrations.set(activityId, {
    subscription,
    bookingId: normalizedBookingId,
    activity,
  });

  logLiveActivity('C1 adopt instance', {
    bookingId: normalizedBookingId,
    activityId,
  });

  schedulePoll(activity, activityId, normalizedBookingId);
}

/**
 * Adoptuje CRM-spuštěné Live Activity instance a registruje C1 (ActivityKit update token).
 * Volat po načtení bookings, při návratu app do popředí a po CRM C2 push-to-start.
 */
export async function adoptServerLiveActivitiesForBookings(
  preferredBookingId: string | null
): Promise<void> {
  if (!currentApiToken) return;

  const instances = BookingActivity.getInstances();
  if (instances.length === 0) {
    logLiveActivity('adopt skipped — no running LA instances');
    return;
  }

  let adoptedCount = 0;
  for (const instance of instances) {
    const bookingId = await resolveBookingIdForInstance(instance, preferredBookingId);
    if (!bookingId) {
      logLiveActivity('adopt skipped — no bookingId for instance', {
        activityId: getActivityId(instance),
      });
      continue;
    }
    ensureActivityRegistration(instance, bookingId);
    adoptedCount += 1;
  }

  if (instances.length > 1 && adoptedCount > 0) {
    logLiveActivity('multiple LA instances adopted', {
      count: instances.length,
      adoptedCount,
    });
  }
}

/** Po C2 start push — adopt s delay (LA může vzniknout až po probuzení app). */
export function scheduleAdoptAfterPushToStart(): void {
  clearC2AdoptTimeouts();
  for (const delayMs of C2_ADOPT_DELAYS_MS) {
    const timeoutId = setTimeout(() => {
      c2AdoptTimeouts.delete(timeoutId);
      void adoptServerLiveActivitiesForBookings(null);
    }, delayMs);
    c2AdoptTimeouts.add(timeoutId);
  }
}

/** @deprecated Server-only — použij adoptServerLiveActivitiesForBookings. */
export function attachActivityPushTokenRegistration(
  activity: BookingLiveActivity,
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
      scheduleAdoptAfterPushToStart();
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
