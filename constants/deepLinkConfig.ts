/**
 * Universal Links (iOS) / App Links (Android) — sdílená konfigurace s webem.
 * Web spec: seo-starter-2/docs/app-deep-links.md
 */

export const APP_DEEP_LINK_HOST = 'realbarber.cz';

export const APP_DEEP_LINK_ORIGIN = `https://${APP_DEEP_LINK_HOST}`;

/** QR / smart open path (MVP). */
export const APP_SMART_DOWNLOAD_PATH = '/aplikace/stahnout';

export const APP_SMART_DOWNLOAD_PATHS = [
  APP_SMART_DOWNLOAD_PATH,
  `${APP_SMART_DOWNLOAD_PATH}/`,
] as const;

/** In-app route after Universal / App Link open (index handles auth → home or login). */
export const APP_SMART_DOWNLOAD_HOME_ROUTE = '/';

/** Safe fallback when an incoming URL has no matching Expo Router screen. */
export const APP_UNKNOWN_PATH_FALLBACK_ROUTE = APP_SMART_DOWNLOAD_HOME_ROUTE;

/** Expo Router paths (group segments omitted) that exist under `app/`. */
export const APP_KNOWN_ROUTE_PATHS = [
  '/',
  '/real-barber',
  '/wallet',
  '/my-haircuts',
  '/inspirace',
  '/experience',
  '/branches',
  '/experience',
  '/services',
  '/guides',
  '/barber-detail',
  '/branch-detail',
  '/service-detail',
  '/hairstyle-detail',
  '/favorites',
  '/bookings',
  '/profile',
  '/chat',
] as const;

/** Prefixes for nested / dynamic in-app routes. */
export const APP_KNOWN_ROUTE_PREFIXES = ['/screens/', '/(tabs)/', '/promo/'] as const;

export const APP_BUNDLE_ID = 'com.realbarber.client';

export const APP_CUSTOM_SCHEME = 'realbarber';

export const APPLE_TEAM_ID = 'VK8YT9654D';

function stripCustomAppScheme(path: string): string {
  const schemePrefix = `${APP_CUSTOM_SCHEME}:`;
  if (!path.startsWith(schemePrefix)) return path;
  const withoutScheme = path.slice(schemePrefix.length).replace(/^\/+/, '');
  return withoutScheme.startsWith('/') ? withoutScheme : `/${withoutScheme}`;
}

export function normalizeIncomingDeepLinkPath(path: string): string {
  let trimmed = path.trim();
  if (!trimmed) return '/';

  trimmed = stripCustomAppScheme(trimmed);

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      return url.pathname || '/';
    }
  } catch {
    // fall through — treat as path
  }

  const withoutQuery = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
  if (!withoutQuery.startsWith('/')) return `/${withoutQuery}`;
  return withoutQuery;
}

/** Zachová `?query` a `#hash` z deep linku pro Expo Router parametry. */
export function extractIncomingDeepLinkSuffix(path: string): string {
  let trimmed = path.trim();
  if (!trimmed) return '';

  trimmed = stripCustomAppScheme(trimmed);

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      return `${url.search}${url.hash}`;
    }
  } catch {
    // fall through — treat as path
  }

  const queryIndex = trimmed.indexOf('?');
  if (queryIndex !== -1) return trimmed.slice(queryIndex);

  const hashIndex = trimmed.indexOf('#');
  if (hashIndex !== -1) return trimmed.slice(hashIndex);

  return '';
}

export function isSmartDownloadPath(path: string): boolean {
  const normalized = normalizeIncomingDeepLinkPath(path);
  return (APP_SMART_DOWNLOAD_PATHS as readonly string[]).includes(normalized);
}

export function resolveSmartDownloadRoute(path: string): string | null {
  return isSmartDownloadPath(path) ? APP_SMART_DOWNLOAD_HOME_ROUTE : null;
}

export function isKnownAppRoute(path: string): boolean {
  const normalized = normalizeIncomingDeepLinkPath(path);
  if ((APP_KNOWN_ROUTE_PATHS as readonly string[]).includes(normalized)) {
    return true;
  }
  return APP_KNOWN_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix)
  );
}

/**
 * Maps Universal / App Link / custom-scheme paths to a valid Expo Router route.
 * Unknown web-only paths (e.g. `/pobocky/...`) fall back to `/` instead of 404.
 */
export function resolveIncomingDeepLinkRoute(path: string): string {
  const suffix = extractIncomingDeepLinkSuffix(path);
  const normalized = normalizeIncomingDeepLinkPath(path);
  const smartDownloadRoute = resolveSmartDownloadRoute(normalized);
  if (smartDownloadRoute) return smartDownloadRoute;

  const promoMatch = normalized.match(/^\/promo\/(poster|kupon)\/([^/?#]+)\/?$/);
  if (promoMatch) {
    return `/promo/${promoMatch[1]}/${promoMatch[2]}${suffix}`;
  }

  if (isKnownAppRoute(normalized)) return `${normalized}${suffix}`;
  return APP_UNKNOWN_PATH_FALLBACK_ROUTE;
}
