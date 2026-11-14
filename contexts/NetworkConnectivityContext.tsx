import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { probeInternetReachability } from '@/utils/probeInternetReachability';

type NetworkConnectivityContextValue = {
  offline: boolean;
  checking: boolean;
  recheck: () => Promise<boolean>;
};

const NetworkConnectivityContext = createContext<NetworkConnectivityContextValue | null>(null);

const RECHECK_ONLINE_GRACE_MS = 2500;

/** Listener — včetně „wifi bez internetu“ (`isInternetReachable === false`). */
function netInfoListenerOffline(state: NetInfoState): boolean {
  if (state.isConnected === false) return true;
  if (state.isConnected === true && state.isInternetReachable === false) return true;
  return false;
}

/** Ruční retry — `reachable: false` přebíjí jen úspěšný probe (iOS občas lže). */
function netInfoRecheckOnline(state: NetInfoState, probeOk: boolean): boolean {
  if (probeOk) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return state.isConnected !== false;
}

export function NetworkConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const suppressOfflineUntilRef = useRef(0);

  const applyState = useCallback((state: NetInfoState) => {
    if (!netInfoListenerOffline(state)) {
      setOnline(true);
      return;
    }
    if (Date.now() < suppressOfflineUntilRef.current) return;
    setOnline(false);
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(applyState);
    void NetInfo.fetch().then(applyState);
    return unsub;
  }, [applyState]);

  const recheck = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    const probePromise = probeInternetReachability();

    try {
      await NetInfo.refresh().catch(() => {});
      const state = await NetInfo.fetch();

      if (netInfoRecheckOnline(state, false)) {
        suppressOfflineUntilRef.current = Date.now() + RECHECK_ONLINE_GRACE_MS;
        setOnline(true);
        return false;
      }

      const probeOk = await probePromise;
      if (netInfoRecheckOnline(state, probeOk)) {
        suppressOfflineUntilRef.current = Date.now() + RECHECK_ONLINE_GRACE_MS;
        setOnline(true);
        return false;
      }

      setOnline(false);
      return true;
    } finally {
      setChecking(false);
    }
  }, []);

  const value = useMemo<NetworkConnectivityContextValue>(
    () => ({
      offline: online === false,
      checking,
      recheck,
    }),
    [checking, online, recheck]
  );

  return (
    <NetworkConnectivityContext.Provider value={value}>{children}</NetworkConnectivityContext.Provider>
  );
}

export function useNetworkConnectivity(): NetworkConnectivityContextValue {
  const ctx = useContext(NetworkConnectivityContext);
  if (!ctx) {
    throw new Error('useNetworkConnectivity must be used within NetworkConnectivityProvider');
  }
  return ctx;
}