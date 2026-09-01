import {
  APP_UNKNOWN_PATH_FALLBACK_ROUTE,
  resolveIncomingDeepLinkRoute,
} from '@/constants/deepLinkConfig';

/**
 * Maps incoming Universal / App Link paths to Expo Router routes.
 * Known app paths pass through; on dev reload unknown web paths fall back to `/`.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const route = resolveIncomingDeepLinkRoute(path, {
      preferHomeOnUnknown: __DEV__ && initial,
    });
    if (__DEV__ && initial && route === '/screens/in-app-web') {
      return APP_UNKNOWN_PATH_FALLBACK_ROUTE;
    }
    return route;
  } catch {
    return APP_UNKNOWN_PATH_FALLBACK_ROUTE;
  }
}
