import {
  APP_UNKNOWN_PATH_FALLBACK_ROUTE,
  extractIncomingDeepLinkSuffix,
  isKnownAppRoute,
  normalizeIncomingDeepLinkPath,
  resolveSmartDownloadRoute,
} from '@/constants/deepLinkConfig';
import {
  resolveWebPathToAppRoute,
  resolveWebPathToRouteOrInAppWeb,
} from '@/lib/linking/resolveWebPath';

export type ResolveIncomingDeepLinkOptions = {
  /** Cold start / Metro reload — avoid in-app-web URLs that 404 on realbarber.cz. */
  preferHomeOnUnknown?: boolean;
};

/**
 * Maps Universal / App Link / custom-scheme paths to a valid Expo Router route.
 * Web paths use shared `resolveWebPathToAppRoute`; unknown paths open in-app-web.
 */
export function resolveIncomingDeepLinkRoute(
  path: string,
  options: ResolveIncomingDeepLinkOptions = {}
): string {
  const suffix = extractIncomingDeepLinkSuffix(path);
  const normalized = normalizeIncomingDeepLinkPath(path);
  const smartDownloadRoute = resolveSmartDownloadRoute(normalized);
  if (smartDownloadRoute) return smartDownloadRoute;

  const promoMatch = normalized.match(/^\/promo\/(poster|kupon)\/([^/?#]+)\/?$/);
  if (promoMatch) {
    return `/promo/${promoMatch[1]}/${promoMatch[2]}${suffix}`;
  }

  const webMapped = resolveWebPathToAppRoute(path);
  if (webMapped) {
    if (options.preferHomeOnUnknown && webMapped.startsWith('/screens/in-app-web')) {
      return APP_UNKNOWN_PATH_FALLBACK_ROUTE;
    }
    return webMapped;
  }

  if (isKnownAppRoute(normalized)) return `${normalized}${suffix}`;

  const fallbackRoute = resolveWebPathToRouteOrInAppWeb(path);
  if (options.preferHomeOnUnknown && fallbackRoute.startsWith('/screens/in-app-web')) {
    return APP_UNKNOWN_PATH_FALLBACK_ROUTE;
  }

  return fallbackRoute;
}
