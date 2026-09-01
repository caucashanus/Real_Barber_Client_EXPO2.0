import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { LOGIN_PATH } from '@/constants/authRoutes';
import {
  APP_DEEP_LINK_HOST,
  APP_DEEP_LINK_ORIGIN,
  extractIncomingDeepLinkSuffix,
  isKnownAppRoute,
  normalizeIncomingDeepLinkPath,
} from '@/constants/deepLinkConfig';
import {
  openOperatorPhone,
  OPERATOR_SUPPORT_E164,
} from '@/utils/operatorContact';

/** mailto / tel / sms — systémový compose; engine po chipu neposouvá konverzaci dál. */
export function isSystemComposeUrl(url: string): boolean {
  return /^(mailto|tel|sms|smsto):/i.test(url.trim());
}

/** @deprecated Use isSystemComposeUrl */
export const isNativeContactUrl = isSystemComposeUrl;

function normalizeWebPathname(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '/';
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return normalizeIncomingDeepLinkPath(trimmed).replace(/\/+$/, '') || '/';
    }
    const path = normalizeIncomingDeepLinkPath(trimmed);
    return path.replace(/\/+$/, '') || '/';
  } catch {
    return trimmed.replace(/\/+$/, '') || '/';
  }
}

/** Parita s web widgetem — `/login` spouští loginRequest, ne openUrl. */
export function isLoginWebPath(url: string): boolean {
  return normalizeWebPathname(url) === '/login';
}

/** Parita s web widgetem — `/u/rezervace` spouští openReservations. */
export function isReservationsWebPath(url: string): boolean {
  return normalizeWebPathname(url) === '/u/rezervace';
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

/** Web cesty → nativní Expo Router screen (bez Safari). */
const WEB_NATIVE_PATH_ROUTES: Record<string, string> = {
  '/inspirace': '/inspirace',
  '/tym': '/experience',
  '/kontakty': '/branches',
};

function toInAppWebRoute(path: string): string {
  const absolute =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${APP_DEEP_LINK_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  return `/screens/in-app-web?url=${encodeURIComponent(absolute)}`;
}

function mapWebPathToAppRoute(path: string): string {
  const normalized = normalizeWebPathname(path);
  const suffix = extractIncomingDeepLinkSuffix(path);

  if (normalized === '/login') {
    return LOGIN_PATH;
  }

  if (normalized === '/u/rezervace') {
    return '/bookings';
  }

  const nativeRoute = WEB_NATIVE_PATH_ROUTES[normalized];
  if (nativeRoute) {
    return `${nativeRoute}${suffix}`;
  }

  if (normalized === '/rezervace' || normalized.startsWith('/rezervace/')) {
    return '/screens/reservation-create';
  }

  if (normalized === '/blog' || normalized.startsWith('/blog/')) {
    return toInAppWebRoute(path);
  }

  if (isKnownAppRoute(normalized)) {
    return `${normalized}${suffix}`;
  }

  return toInAppWebRoute(path);
}

async function openTelUrl(url: string): Promise<void> {
  const digits = normalizePhoneDigits(url.replace(/^tel:/i, ''));
  const operatorDigits = normalizePhoneDigits(OPERATOR_SUPPORT_E164);
  if (digits === operatorDigits) {
    await openOperatorPhone();
    return;
  }
  await Linking.openURL(url).catch(() => {});
}

async function openHttpUrl(url: string): Promise<void> {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const isSameSite =
      host === APP_DEEP_LINK_HOST || host.endsWith(`.${APP_DEEP_LINK_HOST}`);

    if (isSameSite) {
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      const { router } = await import('expo-router');
      router.push(mapWebPathToAppRoute(path) as never);
      return;
    }

    if (host === 'wa.me' || host === 'api.whatsapp.com' || host === 't.me' || host === 'telegram.me') {
      const opened = await Linking.openURL(url).catch(() => false);
      if (!opened) {
        await WebBrowser.openBrowserAsync(url);
      }
      return;
    }
  } catch {
    // fall through — external browser
  }

  await WebBrowser.openBrowserAsync(url);
}

/**
 * Host handler pro snapshot `action: "openUrl"`.
 * URL se bere beze změny ze snapshotu — nikdy neskládat s webBaseUrl u tel/mailto/sms.
 */
export async function openRbicekHostUrl(raw: string, _webBaseUrl?: string): Promise<void> {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const scheme = trimmed.split(':')[0]?.toLowerCase() ?? '';

  if (scheme === 'mailto') {
    await Linking.openURL(trimmed).catch(() => {});
    return;
  }

  if (scheme === 'tel') {
    await openTelUrl(trimmed);
    return;
  }

  if (scheme === 'sms' || scheme === 'smsto') {
    await Linking.openURL(trimmed).catch(() => {});
    return;
  }

  if (scheme === 'tg') {
    await Linking.openURL(trimmed).catch(() => {});
    return;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const { router } = await import('expo-router');
    router.push(mapWebPathToAppRoute(trimmed) as never);
    return;
  }

  if (scheme === 'http' || scheme === 'https') {
    await openHttpUrl(trimmed);
    return;
  }

  await Linking.openURL(trimmed).catch(() => {});
}

/** @deprecated Use openRbicekHostUrl */
export const openRbicekLinkUrl = openRbicekHostUrl;

export function phoneToTelUrl(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  return `tel:${digits.startsWith('+') ? digits : `+${digits}`}`;
}

export function emailToMailtoUrl(email: string): string {
  return `mailto:${email.trim()}`;
}
