import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { addPushToStartTokenListener } from 'expo-widgets';

import { useAuth } from '@/contexts/AuthContext';
import {
  registerPushToStartTokenWithApi,
  setLiveActivityApiToken,
  unregisterAllLiveActivityTokens,
} from '@/utils/liveActivityPushTokens';

export default function LiveActivityPushProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const prevApiTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const previousApiToken = prevApiTokenRef.current;
    prevApiTokenRef.current = apiToken;
    setLiveActivityApiToken(apiToken);

    if (!apiToken && previousApiToken) {
      void unregisterAllLiveActivityTokens(previousApiToken);
      return;
    }
  }, [apiToken]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !apiToken) return;

    const subscription = addPushToStartTokenListener(({ activityPushToStartToken }) => {
      void registerPushToStartTokenWithApi(activityPushToStartToken).catch(() => {
        if (__DEV__) {
          console.warn('[live-activity] C2 register failed');
        }
      });
    });

    return () => {
      subscription.remove();
    };
  }, [apiToken]);

  return <>{children}</>;
}
