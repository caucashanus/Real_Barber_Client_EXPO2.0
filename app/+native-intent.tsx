import {
  normalizeIncomingDeepLinkPath,
  resolveSmartDownloadRoute,
} from '@/constants/deepLinkConfig';

/**
 * Maps incoming Universal / App Link paths to Expo Router routes.
 * MVP: https://realbarber.cz/aplikace/stahnout → home (via `/`).
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const normalized = normalizeIncomingDeepLinkPath(path);
    const homeRoute = resolveSmartDownloadRoute(normalized);
    if (homeRoute) return homeRoute;
    return normalized;
  } catch {
    return '/';
  }
}
