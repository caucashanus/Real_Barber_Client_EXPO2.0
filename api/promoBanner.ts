import { buildClientAppAnalyticsQueryString } from '@/api/clientAppAnalyticsQuery';
import { fetchClientAppV1 } from '@/api/http';
import {
  parsePromoBannerResponse,
  type PromoBanner,
} from '@/utils/promoBannerParse';

export type { PromoBanner };

const FETCH_TIMEOUT_MS = 10_000;

export { parsePromoBannerRecord, parsePromoBannerResponse } from '@/utils/promoBannerParse';

export async function fetchPromoBanner(): Promise<PromoBanner | null> {
  const qs = buildClientAppAnalyticsQueryString();
  const path = qs ? `/promo-banner?${qs}` : '/promo-banner';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const raw = await fetchClientAppV1<unknown>(path, {
      checkAuth: false,
      signal: controller.signal,
    });
    return parsePromoBannerResponse(raw);
  } finally {
    clearTimeout(timeoutId);
  }
}
