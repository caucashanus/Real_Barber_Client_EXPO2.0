import { fetchClientAppV1 } from '@/api/http';

export type MobileCompatibilityPolicy = {
  minNativeVersion: { ios: string; android: string };
  storeUrls: { ios: string; android: string };
  updatedAt: string;
};

const FETCH_TIMEOUT_MS = 10_000;

function isSemverTriple(value: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(value.trim());
}

export function parseMobileCompatibilityPolicy(raw: unknown): MobileCompatibilityPolicy | null {
  if (raw == null || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const minRaw = record.minNativeVersion;
  const storeRaw = record.storeUrls;
  if (minRaw == null || typeof minRaw !== 'object') return null;
  if (storeRaw == null || typeof storeRaw !== 'object') return null;

  const min = minRaw as Record<string, unknown>;
  const store = storeRaw as Record<string, unknown>;
  const iosMin = typeof min.ios === 'string' ? min.ios.trim() : '';
  const androidMin = typeof min.android === 'string' ? min.android.trim() : '';
  const iosStore = typeof store.ios === 'string' ? store.ios.trim() : '';
  const androidStore = typeof store.android === 'string' ? store.android.trim() : '';
  const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt.trim() : '';

  if (!isSemverTriple(iosMin) || !isSemverTriple(androidMin)) return null;
  if (!iosStore || !androidStore) return null;

  return {
    minNativeVersion: { ios: iosMin, android: androidMin },
    storeUrls: { ios: iosStore, android: androidStore },
    updatedAt: updatedAt || new Date(0).toISOString(),
  };
}

export async function fetchMobileCompatibilityPolicy(params: {
  platform: 'ios' | 'android';
  installedVersion: string;
}): Promise<MobileCompatibilityPolicy> {
  const search = new URLSearchParams({
    platform: params.platform,
    installedVersion: params.installedVersion,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const raw = await fetchClientAppV1<unknown>(`/mobile-compatibility?${search.toString()}`, {
      checkAuth: false,
      signal: controller.signal,
    });
    const policy = parseMobileCompatibilityPolicy(raw);
    if (!policy) {
      throw new Error('Invalid mobile compatibility policy');
    }
    return policy;
  } finally {
    clearTimeout(timeoutId);
  }
}
