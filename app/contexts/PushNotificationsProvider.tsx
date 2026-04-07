import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { unregisterPushToken, registerPushToken } from '@/api/push';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { openFromPushNotificationData } from '@/utils/pushNavigation';

const PUSH_TOKEN_KEY = '@expo_push_token';
const PUSH_DEVICE_ID_KEY = '@push_device_id';
const PUSH_META_KEY = '@expo_push_token_meta';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function notificationResponseDedupeKey(response: Notifications.NotificationResponse): string {
  const id = response.notification.request.identifier;
  try {
    const data = response.notification.request.content.data;
    return `${id}:${JSON.stringify(data)}`;
  } catch {
    return id;
  }
}

/** Zabrání dvojí navigaci, když cold start i listener doručí stejný tap. */
const lastHandledRef = { key: '', t: 0 };

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  source: 'cold-start' | 'tap'
) {
  const key = notificationResponseDedupeKey(response);
  const now = Date.now();
  if (lastHandledRef.key === key && now - lastHandledRef.t < 900) {
    return;
  }
  lastHandledRef.key = key;
  lastHandledRef.t = now;

  const raw = response.notification.request.content.data;
  const deferMs = source === 'cold-start' ? 220 : 0;
  openFromPushNotificationData(raw as Record<string, unknown>, { deferMs });
}

async function getOrRequestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function getExpoPushToken(): Promise<string | null> {
  const granted = await getOrRequestPermission();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data ?? null;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(PUSH_DEVICE_ID_KEY).catch(() => null);
  if (existing) return existing;
  const created = `rb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(PUSH_DEVICE_ID_KEY, created).catch(() => {});
  return created;
}

export default function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const { locale } = useLanguage();
  const responseSubRef = useRef<Notifications.EventSubscription | null>(null);
  const prevApiTokenRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    responseSubRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response, 'tap');
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        handleNotificationResponse(response, 'cold-start');
      })
      .catch(() => {});

    return () => {
      responseSubRef.current?.remove();
      responseSubRef.current = null;
    };
  }, []);

  async function ensureRegistered(currentApiToken: string): Promise<void> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    const token = await getExpoPushToken();
    if (!token) return;

    const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const cachedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY).catch(() => null);
    const cachedMetaRaw = await AsyncStorage.getItem(PUSH_META_KEY).catch(() => null);
    const cachedMeta =
      cachedMetaRaw && typeof cachedMetaRaw === 'string'
        ? (() => {
            try {
              return JSON.parse(cachedMetaRaw) as { appVersion?: string };
            } catch {
              return null;
            }
          })()
        : null;

    const sameToken = cachedToken === token;
    const sameVersion = (cachedMeta?.appVersion ?? null) === appVersion;
    if (sameToken && sameVersion) return;

    const deviceId = await getOrCreateDeviceId();
    await registerPushToken(currentApiToken, {
      token,
      platform,
      appVersion,
      deviceId,
      locale,
      timezone,
    });

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token).catch(() => {});
    await AsyncStorage.setItem(PUSH_META_KEY, JSON.stringify({ appVersion })).catch(() => {});
  }

  useEffect(() => {
    const previousApiToken = prevApiTokenRef.current;
    prevApiTokenRef.current = apiToken;

    if (!apiToken && previousApiToken) {
      AsyncStorage.getItem(PUSH_TOKEN_KEY)
        .then(async (token) => {
          if (!token) return;
          try {
            await unregisterPushToken(previousApiToken, token);
            if (__DEV__) {
              console.log('[push] unregister ok');
            }
          } catch {
            if (__DEV__) {
              console.log('[push] unregister failed');
            }
            // ignore backend errors on logout
          } finally {
            await AsyncStorage.removeItem(PUSH_TOKEN_KEY).catch(() => {});
            await AsyncStorage.removeItem(PUSH_META_KEY).catch(() => {});
          }
        })
        .catch(() => {});
      return;
    }

    if (!apiToken) return;

    let cancelled = false;
    (async () => {
      try {
        await ensureRegistered(apiToken);
        if (__DEV__) {
          console.log('[push] register ok');
        }
      } catch {
        if (__DEV__) {
          console.log('[push] register failed');
        }
        // keep app flow unaffected if push setup fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiToken, locale]);

  useEffect(() => {
    if (!apiToken) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev !== 'active' && nextState === 'active') {
        ensureRegistered(apiToken).catch(() => {});
      }
    });

    return () => sub.remove();
  }, [apiToken, locale]);

  return <>{children}</>;
}
