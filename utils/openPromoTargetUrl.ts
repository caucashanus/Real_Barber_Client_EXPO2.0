import * as WebBrowser from 'expo-web-browser';

import {
  APP_DEEP_LINK_HOST,
  isKnownAppRoute,
  normalizeIncomingDeepLinkPath,
} from '@/constants/deepLinkConfig';

function mapWebPathToAppRoute(path: string): string {
  const normalized = normalizeIncomingDeepLinkPath(path);

  if (normalized === '/rezervace' || normalized.startsWith('/rezervace/')) {
    return '/screens/reservation-create';
  }

  if (isKnownAppRoute(normalized)) {
    return normalized;
  }

  const absolute =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `https://${APP_DEEP_LINK_HOST}${path.startsWith('/') ? path : `/${path}`}`;

  return `/screens/in-app-web?url=${encodeURIComponent(absolute)}`;
}

/** Poster CTA — interní path, same-site realbarber.cz, nebo externí URL. */
export async function openPromoTargetUrl(rawUrl: string): Promise<void> {
  const trimmed = rawUrl.trim();
  if (!trimmed) return;

  const { router } = await import('expo-router');

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    router.push(mapWebPathToAppRoute(trimmed) as never);
    return;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const isSameSite =
      host === APP_DEEP_LINK_HOST || host.endsWith(`.${APP_DEEP_LINK_HOST}`);

    if (isSameSite) {
      const path = `${url.pathname}${url.search}${url.hash}`;
      router.push(mapWebPathToAppRoute(path) as never);
      return;
    }
  } catch {
    // fall through — open as external URL
  }

  await WebBrowser.openBrowserAsync(trimmed);
}
