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

    void adoptServerLiveActivitiesForBookings(null);

    const subscription = addPushToStartTokenListener(({ activityPushToStartToken }) => {
      void registerPushToStartTokenWithApi(activityPushToStartToken).catch((error) => {
        console.warn('[live-activity] C2 register failed', error);
      });
    });

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void adoptServerLiveActivitiesForBookings(null);
      }
    });

    return () => {
      subscription.remove();
      appStateSub.remove();
    };
  }, [apiToken]);

  return <>{children}</>;
}
