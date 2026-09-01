import { LOGIN_PATH } from '@/constants/authRoutes';
import {
  APP_DEEP_LINK_ORIGIN,
  extractIncomingDeepLinkSuffix,
  isKnownAppRoute,
  normalizeIncomingDeepLinkPath,
} from '@/constants/deepLinkConfig';
import { PROFILE_PRIVACY_APP_ROUTE } from '@/constants/profileContacts';
import {
  barberDetailHref,
  branchDetailHref,
  hairstyleDetailHref,
} from '@/constants/profileDetailRoutes';

/** Normalizovaná pathname bez trailing slash (kromě `/`). */
export function normalizeWebPathname(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '/';
  try {
    const path = normalizeIncomingDeepLinkPath(trimmed);
    return path.replace(/\/+$/, '') || '/';
  } catch {
    return trimmed.replace(/\/+$/, '') || '/';
  }
}

export function isLoginWebPath(url: string): boolean {
  return normalizeWebPathname(url) === '/login';
}

export function isReservationsWebPath(url: string): boolean {
  return normalizeWebPathname(url) === '/u/rezervace';
}

function buildInAppWebRoute(path: string): string {
  const absolute =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${APP_DEEP_LINK_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  return `/screens/in-app-web?url=${encodeURIComponent(absolute)}`;
}

const WEB_PATH_EXACT_ROUTES: Record<string, string> = {
  '/inspirace': '/inspirace',
  '/tym': '/experience',
  '/kontakty': '/branches',
  '/sluzby': '/services',
  '/cenik': '/services',
  '/mapa': '/screens/map',
};

/**
 * Mapuje web cestu (realbarber.cz nebo relativní `/…`) na Expo Router route.
 * Vrací `null`, pokud cesta není web path — volající použije vlastní fallback.
 *
 * Pravidla jsou prefix-based: nový účes `/sluzby/{slug}/` funguje bez úpravy kódu.
 */
export function resolveWebPathToAppRoute(path: string): string | null {
  const normalized = normalizeWebPathname(path);
  const suffix = extractIncomingDeepLinkSuffix(path);

  if (normalized === '/login') {
    return `${LOGIN_PATH}${suffix}`;
  }

  if (normalized === '/u/rezervace') {
    return `/bookings${suffix}`;
  }

  if (normalized === '/u/nastaveni/profil') {
    return `/screens/edit-profile${suffix}`;
  }

  if (
    normalized === '/gdpr' ||
    normalized === '/ochrana-osobnich-udaju' ||
    normalized === '/ochrana-osobnich-udaj'
  ) {
    return PROFILE_PRIVACY_APP_ROUTE;
  }

  const exactRoute = WEB_PATH_EXACT_ROUTES[normalized];
  if (exactRoute) {
    return `${exactRoute}${suffix}`;
  }

  const hairstyleSlug = normalized.match(/^\/sluzby\/([^/]+)$/);
  if (hairstyleSlug?.[1]) {
    return `${hairstyleDetailHref(decodeURIComponent(hairstyleSlug[1]))}${suffix}`;
  }

  const teamSlug = normalized.match(/^\/tym\/([^/]+)$/);
  if (teamSlug?.[1]) {
    return `${barberDetailHref(decodeURIComponent(teamSlug[1]))}${suffix}`;
  }

  const branchSlug = normalized.match(/^\/branches\/([^/]+)$/);
  if (branchSlug?.[1]) {
    return `${branchDetailHref(decodeURIComponent(branchSlug[1]))}${suffix}`;
  }

  if (normalized === '/rezervace' || normalized.startsWith('/rezervace/')) {
    return '/screens/reservation-create';
  }

  if (normalized === '/blog' || normalized.startsWith('/blog/')) {
    return buildInAppWebRoute(path);
  }

  if (isKnownAppRoute(normalized)) {
    return `${normalized}${suffix}`;
  }

  return null;
}

/** Web path bez nativního screenu → in-app browser wrapper. */
export function resolveWebPathToRouteOrInAppWeb(path: string): string {
  return resolveWebPathToAppRoute(path) ?? buildInAppWebRoute(path);
}
