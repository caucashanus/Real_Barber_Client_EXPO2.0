import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { APP_DEEP_LINK_HOST } from '@/constants/deepLinkConfig';
import {
  isLoginWebPath,
  isReservationsWebPath,
  resolveWebPathToRouteOrInAppWeb,
} from '@/lib/linking/resolveWebPath';
import {
  openOperatorPhone,
  OPERATOR_SUPPORT_E164,
} from '@/utils/operatorContact';

export { isLoginWebPath, isReservationsWebPath } from '@/lib/linking/resolveWebPath';

/** mailto / tel / sms — systémový compose; engine po chipu neposouvá konverzaci dál. */
export function isSystemComposeUrl(url: string): boolean {
  return /^(mailto|tel|sms|smsto):/i.test(url.trim());
}

/** @deprecated Use isSystemComposeUrl */
export const isNativeContactUrl = isSystemComposeUrl;

/**
 * True when URL navigates to another in-app screen (Expo Router).
 * External compose (tel/mailto/sms), WhatsApp/Telegram, maps and Safari stay false — chat remains open.
 */
export function opensInAppScreen(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;

  if (isSystemComposeUrl(trimmed)) return false;

  const scheme = trimmed.split(':')[0]?.toLowerCase() ?? '';
  if (scheme === 'tg') return false;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  if (scheme === 'http' || scheme === 'https') {
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

      if (
        host === 'wa.me' ||
        host === 'api.whatsapp.com' ||
        host === 't.me' ||
        host === 'telegram.me'
      ) {
        return false;
      }

      return host === APP_DEEP_LINK_HOST || host.endsWith(`.${APP_DEEP_LINK_HOST}`);
    } catch {
      return false;
    }
  }

  return false;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/[^\d+]/g, '');
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
      router.push(resolveWebPathToRouteOrInAppWeb(path) as never);
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
    router.push(resolveWebPathToRouteOrInAppWeb(trimmed) as never);
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
