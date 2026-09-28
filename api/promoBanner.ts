import { fetchCrm } from '@/api/http';
import { getClientAppPlatformParam } from '@/api/clientAppAnalyticsQuery';
import {
  parsePromoBannerResponse,
  type PromoBanner,
} from '@/utils/promoBannerParse';
import { getInstalledNativeAppVersion } from '@/utils/appVersionSupport';

export type { PromoBanner };

const FETCH_TIMEOUT_MS = 10_000;

export { parsePromoBannerRecord, parsePromoBannerResponse } from '@/utils/promoBannerParse';

function buildFullscreenBannerQueryString(): string {
  const search = new URLSearchParams({ channel: 'native' });
  const platform = getClientAppPlatformParam();
  if (platform) {
    search.set('platform', platform);
    search.set('installedVersion', getInstalledNativeAppVersion());
  }
  return search.toString();
}

/** GET /api/fullscreen-banner?channel=native — CRM cílení showNative. */
export async function fetchPromoBanner(): Promise<PromoBanner | null> {
  const path = `/api/fullscreen-banner?${buildFullscreenBannerQueryString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const raw = await fetchCrm<unknown>(path, {
      checkAuth: false,
      signal: controller.signal,
    });
    return parsePromoBannerResponse(raw);
  } finally {
    clearTimeout(timeoutId);
  }
}
