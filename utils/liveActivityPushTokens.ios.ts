import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import type { LiveActivity } from 'expo-widgets';

import {
  registerActivityKitPushToken,
  registerPushToStartToken,
  unregisterLiveActivityToken,
} from '@/api/liveActivityPush';

const PUSH_DEVICE_ID_KEY = '@push_device_id';
const PUSH_TO_START_TOKEN_KEY = '@live_activity_push_to_start_token';
const ACTIVITY_KIT_TOKEN_KEY = '@live_activity_activitykit_token';

let currentApiToken: string | null = null;
let pushTokenSubscription: EventSubscription | null = null;
let lastRegisteredActivityId: string | null = null;
let lastActivityKitRegistrationKey: string | null = null;
let lastPushToStartRegistrationKey: string | null = null;

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
  pushTokenSubscription?.remove();
  pushTokenSubscription = null;
}

async function postActivityKitToken(bookingId: string, activityId: string, pushToken: string): Promise<void> {
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

  if (__DEV__) {
    console.log('[live-activity] C1 register ok');
  }
}

export function attachActivityPushTokenRegistration(
  activity: LiveActivity<unknown>,
  bookingId: string
): void {
  detachActivityPushTokenRegistration();

  pushTokenSubscription = activity.addPushTokenListener(({ activityId, pushToken }) => {
    void postActivityKitToken(bookingId, activityId, pushToken).catch(() => {
      if (__DEV__) {
        console.warn('[live-activity] C1 register failed');
      }
    });
  });
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
  await registerPushToStartToken(currentApiToken, {
    pushToken: registrationKey,
    deviceId,
    appVersion: getAppVersion(),
  });

  lastPushToStartRegistrationKey = registrationKey;
  await AsyncStorage.setItem(PUSH_TO_START_TOKEN_KEY, registrationKey).catch(() => {});

  if (__DEV__) {
    console.log('[live-activity] C2 register ok');
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
    if (__DEV__) {
      console.log('[live-activity] C3 unregister ok');
    }
  } catch {
    if (__DEV__) {
      console.warn('[live-activity] C3 unregister failed');
    }
  } finally {
    detachActivityPushTokenRegistration();
    lastRegisteredActivityId = null;
    lastActivityKitRegistrationKey = null;
    lastPushToStartRegistrationKey = null;
    await AsyncStorage.multiRemove([PUSH_TO_START_TOKEN_KEY, ACTIVITY_KIT_TOKEN_KEY]).catch(() => {});
  }
}
