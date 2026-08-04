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

export const APP_BUNDLE_ID = 'com.realbarber.client';

export const APPLE_TEAM_ID = 'VK8YT9654D';

export function normalizeIncomingDeepLinkPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';

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

export function isSmartDownloadPath(path: string): boolean {
  const normalized = normalizeIncomingDeepLinkPath(path);
  return (APP_SMART_DOWNLOAD_PATHS as readonly string[]).includes(normalized);
}

export function resolveSmartDownloadRoute(path: string): string | null {
  return isSmartDownloadPath(path) ? APP_SMART_DOWNLOAD_HOME_ROUTE : null;
}
