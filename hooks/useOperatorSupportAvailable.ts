import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getOperatorOpenStatus } from '@/utils/operatorOpenStatus';

const CHECK_INTERVAL_MS = 60_000;

export function useOperatorSupportAvailable(): boolean {
  const [available, setAvailable] = useState(() => {
    const status = getOperatorOpenStatus();
    return status === 'open' || status === 'closingSoon';
  });

  useEffect(() => {
    const sync = () => {
      const status = getOperatorOpenStatus();
      setAvailable(status === 'open' || status === 'closingSoon');
    };

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
