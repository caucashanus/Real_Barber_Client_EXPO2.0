import type { Booking } from '@/api/bookings';
import type { Locale } from '@/contexts/LanguageContext';
import { Share } from 'react-native';
import { APP_DEEP_LINK_ORIGIN } from '@/constants/deepLinkConfig';
import { getTranslation } from '@/locales';
import type { TranslationKey } from '@/locales';
import type { RelativeDayLocale } from '@/utils/formatRelativeDayLabel';
import { interpolateTemplate } from '@/utils/profileShareLinks';

export const RESERVATION_SHARE_WEB_ORIGIN = APP_DEEP_LINK_ORIGIN;

export type ReservationShareBooking = Pick<
  Booking,
  'id' | 'date' | 'slotStart' | 'slotEnd' | 'branch'
>;

function shareLocaleTag(locale: RelativeDayLocale): string {
  if (locale === 'cs') return 'cs-CZ';
  if (locale === 'uk') return 'uk-UA';
  return 'en-GB';
}

/** Web spec: weekday short + day + month short, e.g. `pá 10. 8.` */
export function formatReservationShareShortDate(
  dateIso: string,
  locale: RelativeDayLocale = 'cs'
): string {
  const raw = dateIso.trim().slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return raw;
  }
  const date = new Date(y, m - 1, d);
  const tag = shareLocaleTag(locale);
  const weekday = date.toLocaleDateString(tag, { weekday: 'short' }).replace(/\.$/, '');
  if (locale === 'cs' || locale === 'uk') {
    return `${weekday} ${d}. ${m}.`;
  }
  const month = date.toLocaleDateString(tag, { month: 'short' });
  return `${weekday} ${d} ${month}`;
}

export function buildReservationShareUrl(
  bookingId: string,
  locale: Locale | RelativeDayLocale = 'cs'
): string {
  const id = bookingId.trim();
  const prefix = locale === 'cs' ? '' : `/${locale}`;
  return `${RESERVATION_SHARE_WEB_ORIGIN}${prefix}/r/${encodeURIComponent(id)}/`;
}

export function buildReservationSharePayload(
  booking: ReservationShareBooking,
  locale: RelativeDayLocale = 'cs'
): { url: string; title: string; text: string } {
  const url = buildReservationShareUrl(booking.id, locale);
  const slotEnd = (booking.slotEnd || booking.slotStart || '').trim() || booking.slotStart;
  const shortDate = formatReservationShareShortDate(booking.date, locale);
  const branchName = (booking.branch?.name ?? '').trim() || '—';
  const detail = `${shortDate} ${booking.slotStart}–${slotEnd}, ${branchName}`;

  if (locale === 'uk') {
    return {
      url,
      title: 'Подивись на моє бронювання | Real Barber',
      text: `Я поділився з тобою своїм записом у Real Barber. Подивись деталі: ${url}\n${detail}`,
    };
  }

  const appLocale: Locale = locale === 'en' ? 'en' : 'cs';
  const t = (key: TranslationKey) => getTranslation(appLocale, key);
  const line1 = interpolateTemplate(t('bookingShareMessage'), { url });

  return {
    url,
    title: t('bookingShareTitle'),
    text: `${line1}\n${detail}`,
  };
}

export async function shareReservationUrl(
  url: string,
  copyFallback: (text: string) => void
): Promise<void> {
  try {
    // iOS `url` is for file:// only — https triggers "Cannot issue sandbox extension for URL".
    await Share.share({ message: url });
  } catch {
    copyFallback(url);
  }
}

export async function shareReservationBooking(
  booking: ReservationShareBooking,
  locale: RelativeDayLocale,
  copyFallback: (text: string) => void
): Promise<void> {
  if (!booking.id) return;
  const url = buildReservationShareUrl(booking.id, locale);
  await shareReservationUrl(url, copyFallback);
}
