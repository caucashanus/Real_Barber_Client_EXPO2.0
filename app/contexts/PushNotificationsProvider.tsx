import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { unregisterPushToken, registerPushToken } from '@/api/push';
import { useLanguage } from '@/app/contexts/LanguageContext';

const PUSH_TOKEN_KEY = '@expo_push_token';
const PUSH_DEVICE_ID_KEY = '@push_device_id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const txt = value.trim();
  return txt.length > 0 ? txt : null;
}

function openFromNotification(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const deepLink = asString(data.deeplink) ?? asString(data.deepLink) ?? asString(data.route);
  if (!deepLink) return;
  router.push(deepLink as never);
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
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;
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

  useEffect(() => {
    responseSubRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const raw = response.notification.request.content.data;
      openFromNotification(raw as Record<string, unknown>);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const raw = response.notification.request.content.data;
        openFromNotification(raw as Record<string, unknown>);
      })
      .catch(() => {});

    return () => {
      responseSubRef.current?.remove();
      responseSubRef.current = null;
    };
  }, []);

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
          }
        })
        .catch(() => {});
      return;
    }

    if (!apiToken) return;

    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
        const token = await getExpoPushToken();
        if (cancelled || !token) return;
        const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY).catch(() => null);
        if (cached === token) return;
        const deviceId = await getOrCreateDeviceId();
        await registerPushToken(apiToken, {
          token,
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version,
          deviceId,
          locale,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token).catch(() => {});
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

  return <>{children}</>;
}

