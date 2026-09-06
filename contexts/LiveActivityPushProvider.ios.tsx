import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { addPushToStartTokenListener } from 'expo-widgets';

import { useAuth } from '@/contexts/AuthContext';
import {
  adoptServerLiveActivitiesForBookings,
  registerPushToStartTokenWithApi,
  setLiveActivityApiToken,
  unregisterAllLiveActivityTokens,
} from '@/utils/liveActivityPushTokens';

const ADOPT_INTERVAL_MS = 15_000;

export default function LiveActivityPushProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const prevApiTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const previousApiToken = prevApiTokenRef.current;
    prevApiTokenRef.current = apiToken;
    setLiveActivityApiToken(apiToken);

    if (!apiToken && previousApiToken) {
      void unregisterAllLiveActivityTokens(previousApiToken);
    }
  }, [apiToken]);

  useEffect(() => {
    if (!apiToken) return;

    const subscription = addPushToStartTokenListener(({ activityPushToStartToken }) => {
      void registerPushToStartTokenWithApi(activityPushToStartToken).catch((error: unknown) => {
        console.warn('[live-activity] C2 register failed', error);
      });
    });

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void adoptServerLiveActivitiesForBookings(null);
      }
    });

    const adoptInterval = setInterval(() => {
      void adoptServerLiveActivitiesForBookings(null);
    }, ADOPT_INTERVAL_MS);

    return () => {
      subscription.remove();
      appStateSub.remove();
      clearInterval(adoptInterval);
    };
  }, [apiToken]);

  return <>{children}</>;
}
