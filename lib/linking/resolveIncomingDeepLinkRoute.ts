import {
  APP_SMART_DOWNLOAD_HOME_ROUTE,
  extractIncomingDeepLinkSuffix,
  isKnownAppRoute,
  normalizeIncomingDeepLinkPath,
  resolveSmartDownloadRoute,
} from '@/constants/deepLinkConfig';
import {
  resolveWebPathToAppRoute,
  resolveWebPathToRouteOrInAppWeb,
} from '@/lib/linking/resolveWebPath';

/**
 * Maps Universal / App Link / custom-scheme paths to a valid Expo Router route.
 * Web paths use shared `resolveWebPathToAppRoute`; unknown paths open in-app-web.
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

  const webMapped = resolveWebPathToAppRoute(path);
  if (webMapped) return webMapped;

  if (isKnownAppRoute(normalized)) return `${normalized}${suffix}`;

  return resolveWebPathToRouteOrInAppWeb(path);
}
