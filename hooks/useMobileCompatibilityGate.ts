import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { fetchMobileCompatibilityPolicy } from '@/api/mobileCompatibility';
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

  useEffect(() => {
    if (skipRemoteCompatibilityCheck()) {
      setPhase('ready');
      setBlocked(false);
      setStoreUrl(getStoreUpdateUrl(platform));
      return;
    }

    let cancelled = false;
    const installedVersion = getInstalledNativeAppVersion();

    const applyPolicy = (
      policy: Parameters<typeof shouldBlockNativeAppForPolicy>[0]['policy']
    ) => {
      setBlocked(
        shouldBlockNativeAppForPolicy({ installedVersion, platform, policy })
      );
      setStoreUrl(storeUpdateUrlForPlatform(platform, policy));
    };

    void (async () => {
      try {
        const policy = await fetchMobileCompatibilityPolicy({
          platform,
          installedVersion,
        });
        await writeCachedMobileCompatibilityPolicy(policy);
        if (cancelled) return;
        applyPolicy(policy);
      } catch {
        const cached = await readCachedMobileCompatibilityPolicy();
        if (cancelled) return;
        if (cached) {
          applyPolicy(cached);
        } else {
          setBlocked(false);
          setStoreUrl(getStoreUpdateUrl(platform));
        }
      } finally {
        if (!cancelled) setPhase('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [platform]);

  return { phase, blocked, storeUrl };
}
