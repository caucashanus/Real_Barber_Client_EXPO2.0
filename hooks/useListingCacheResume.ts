import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { invalidateAllListingsOnResume } from '@/lib/availability/listingCache';

export function useListingCacheResume(): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        invalidateAllListingsOnResume();
      }
    });
    return () => sub.remove();
  }, []);
}
