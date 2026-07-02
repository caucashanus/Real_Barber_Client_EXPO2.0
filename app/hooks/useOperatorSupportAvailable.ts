import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { isOperatorSupportAvailable } from '@/utils/operatorSupportHours';

const CHECK_INTERVAL_MS = 60_000;

export function useOperatorSupportAvailable(): boolean {
  const [available, setAvailable] = useState(() => isOperatorSupportAvailable());

  useEffect(() => {
    const sync = () => setAvailable(isOperatorSupportAvailable());

    sync();
    const intervalId = setInterval(sync, CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') sync();
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return available;
}
