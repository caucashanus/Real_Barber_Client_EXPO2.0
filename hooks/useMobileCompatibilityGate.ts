import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { fetchMobileCompatibilityPolicy } from '@/api/mobileCompatibility';
import type { MobileCompatibilityPolicy } from '@/api/mobileCompatibility';
import { getStoreUpdateUrl } from '@/constants/appVersionPolicy';
import { getInstalledNativeAppVersion } from '@/utils/appVersionSupport';
import {
  shouldBlockNativeAppForPolicy,
  storeUpdateUrlForPlatform,
} from '@/utils/mobileCompatibilityGate';
import {
  readCachedMobileCompatibilityPolicy,
  writeCachedMobileCompatibilityPolicy,
} from '@/utils/mobileCompatibilityStorage';

type GatePhase = 'checking' | 'ready';

/** While blocked, re-check CRM so lowered min version unlocks without reinstall. */
const BLOCKED_RECHECK_MS = 15_000;

function nativePlatform(): 'ios' | 'android' {
  return Platform.OS === 'android' ? 'android' : 'ios';
}

function skipRemoteCompatibilityCheck(): boolean {
  return Platform.OS !== 'ios' && Platform.OS !== 'android';
}

export function useMobileCompatibilityGate(): {
  phase: GatePhase;
  blocked: boolean;
  storeUrl: string;
} {
  const platform = nativePlatform();
  const [phase, setPhase] = useState<GatePhase>(() =>
    skipRemoteCompatibilityCheck() ? 'ready' : 'checking'
  );
  const [blocked, setBlocked] = useState(false);
  const [storeUrl, setStoreUrl] = useState(() => getStoreUpdateUrl(platform));

  const applyPolicy = useCallback(
    (policy: MobileCompatibilityPolicy) => {
      const installedVersion = getInstalledNativeAppVersion();
      setBlocked(
        shouldBlockNativeAppForPolicy({ installedVersion, platform, policy })
      );
      setStoreUrl(storeUpdateUrlForPlatform(platform, policy));
    },
    [platform]
  );

  const runCheck = useCallback(
    async (options: { showChecking: boolean }) => {
      if (skipRemoteCompatibilityCheck()) {
        setPhase('ready');
        setBlocked(false);
        setStoreUrl(getStoreUpdateUrl(platform));
        return;
      }

      if (options.showChecking) {
        setPhase('checking');
      }

      const installedVersion = getInstalledNativeAppVersion();

      try {
        const policy = await fetchMobileCompatibilityPolicy({
          platform,
          installedVersion,
        });
        await writeCachedMobileCompatibilityPolicy(policy);
        applyPolicy(policy);
      } catch {
        const cached = await readCachedMobileCompatibilityPolicy();
        if (cached) {
          applyPolicy(cached);
        } else {
          setBlocked(false);
          setStoreUrl(getStoreUpdateUrl(platform));
        }
      } finally {
        setPhase('ready');
      }
    },
    [applyPolicy, platform]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (cancelled) return;
      await runCheck({ showChecking: true });
    })();

    const onAppStateChange = (next: AppStateStatus) => {
      if (next !== 'active' || cancelled) return;
      void runCheck({ showChecking: false });
    };

    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      appStateSub.remove();
    };
  }, [runCheck]);

  useEffect(() => {
    if (!blocked) return;

    const id = setInterval(() => {
      void runCheck({ showChecking: false });
    }, BLOCKED_RECHECK_MS);

    return () => clearInterval(id);
  }, [blocked, runCheck]);

  return { phase, blocked, storeUrl };
}
