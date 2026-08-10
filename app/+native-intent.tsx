import { resolveIncomingDeepLinkRoute } from '@/constants/deepLinkConfig';

/**
 * Maps incoming Universal / App Link paths to Expo Router routes.
 * Known app paths pass through; web-only paths fall back to `/` (auth → home or login).
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    return resolveIncomingDeepLinkRoute(path);
  } catch {
    return '/';
  }
}
