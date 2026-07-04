import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@rb_operator_button_enabled_v1';

type Listener = (enabled: boolean) => void;
const listeners = new Set<Listener>();
let cachedEnabled: boolean | null = null;

function notify(enabled: boolean): void {
  listeners.forEach((listener) => listener(enabled));
}

export async function getOperatorButtonEnabled(): Promise<boolean> {
  if (cachedEnabled !== null) return cachedEnabled;

  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  cachedEnabled = raw !== 'false';
  return cachedEnabled;
}

export async function setOperatorButtonEnabled(enabled: boolean): Promise<void> {
  cachedEnabled = enabled;
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false').catch(() => {});
  notify(enabled);
}

export function subscribeOperatorButtonEnabled(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOperatorButtonEnabled(): {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isLoading: boolean;
} {
  const [enabled, setEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getOperatorButtonEnabled().then((value) => {
      if (!cancelled) {
        setEnabledState(value);
        setIsLoading(false);
      }
    });

    const unsubscribe = subscribeOperatorButtonEnabled((value) => {
      if (!cancelled) setEnabledState(value);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    void setOperatorButtonEnabled(value);
  }, []);

  return { enabled, setEnabled, isLoading };
}
