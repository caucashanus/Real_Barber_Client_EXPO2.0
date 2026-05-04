import type { Booking } from '@/api/bookings';
import type { TranslationKey } from '@/locales';
import {
  getBookingEndDate,
  getBookingClientReviewRating,
  getBookingStartDate,
  isBookingDuringSlotAt,
  isBookingFutureStartAt,
  isBookingMarkedCompleted,
  isBookingNotCancelled,
} from '@/utils/bookingHelpers';

/** Jak dlouho po konci slotu ještě nabízet recenzi ve spotlightu. */
export const HOME_SPOTLIGHT_REVIEW_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/** „Brzy u vás“ — do této doby do začátku. */
export const HOME_SPOTLIGHT_SOON_MS = 60 * 60 * 1000;

/** Bez `completed` v systému: recenze až po konci slotu + tento buffer. */
export const HOME_SPOTLIGHT_REVIEW_GRACE_AFTER_END_MS = 15 * 60 * 1000;

export type HomeSpotlightState = 'current' | 'soon' | 'today' | 'upcoming' | 'review';

export const HOME_SPOTLIGHT_TITLE_KEY: Record<HomeSpotlightState, TranslationKey> = {
  current: 'homeSpotlightCurrent',
  soon: 'homeSpotlightSoon',
  today: 'homeSpotlightToday',
  upcoming: 'homeSpotlightUpcoming',
  review: 'homeSpotlightReview',
};

export interface HomeSpotlight {
  booking: Booking;
  state: HomeSpotlightState;
  msUntilStart: number;
  /** 1–5 z objektu rezervace (`clientReview` / `clientReviewRating` z API). */
  existingReviewRating?: number;
}

export function isHomeSpotlightReviewEligible(booking: Booking, nowMs: number): boolean {
  if (!isBookingNotCancelled(booking)) return false;
  const end = getBookingEndDate(booking).getTime();
  if (nowMs - end > HOME_SPOTLIGHT_REVIEW_MAX_AGE_MS) return false;
  if (isBookingMarkedCompleted(booking)) return true;
  return nowMs >= end + HOME_SPOTLIGHT_REVIEW_GRACE_AFTER_END_MS;
}

/**
 * Vybere jednu rezervaci pro horní kartu na Real Barber.
 * Priorita: probíhající slot → nejbližší budoucí (soon / today / upcoming) → recenze.
 */
export function pickHomeSpotlight(bookings: Booking[], nowMs: number): HomeSpotlight | null {
  const active = bookings.find((b) => isBookingDuringSlotAt(b, nowMs));
  if (active) {
    return { booking: active, state: 'current', msUntilStart: 0 };
  }

  const upcoming = bookings
    .filter((b) => isBookingFutureStartAt(b, nowMs))
    .sort((a, b) => getBookingStartDate(a).getTime() - getBookingStartDate(b).getTime());

  if (upcoming.length > 0) {
    const b = upcoming[0];
    const msUntilStart = getBookingStartDate(b).getTime() - nowMs;
    const startDate = getBookingStartDate(b);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const isToday = startDate >= todayStart && startDate < tomorrowStart;
    let state: HomeSpotlightState;
    if (msUntilStart <= HOME_SPOTLIGHT_SOON_MS) state = 'soon';
    else if (isToday) state = 'today';
    else state = 'upcoming';
    return { booking: b, state, msUntilStart };
  }

  const reviewCandidates = bookings
    .filter((b) => isHomeSpotlightReviewEligible(b, nowMs))
    .sort((a, b) => {
      const done = (booking: Booking) => {
        const r = getBookingClientReviewRating(booking);
        return r != null && r >= 1;
      };
      const delta = Number(done(a)) - Number(done(b));
      if (delta !== 0) return delta;
      return getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime();
    });

  if (reviewCandidates.length > 0) {
    const booking = reviewCandidates[0];
    const existingReviewRating = getBookingClientReviewRating(booking);
    return { booking, state: 'review', msUntilStart: 0, existingReviewRating };
  }

  return null;
}

export function formatHomeSpotlightCountdown(ms: number, locale: string): string {
  const totalMin = Math.floor(ms / 60000);
  const prefix = locale.startsWith('cs') ? 'za' : 'in';
  const minLabel = locale.startsWith('cs') ? 'min' : 'min';
  const hourLabel = locale.startsWith('cs') ? 'hod' : 'h';
  if (totalMin < 60) return `${prefix} ${totalMin} ${minLabel}`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (mins === 0) return `${prefix} ${hours} ${hourLabel}`;
  return `${prefix} ${hours} ${hourLabel} ${mins} ${minLabel}`;
}

/** Kompaktní datum + čas začátku (stejné jako dřív v home listu). */
export function formatHomeBookingSlotLabel(booking: Booking): string {
  const parts: string[] = [];
  if (booking.date) {
    const [, m, d] = booking.date.slice(0, 10).split('-');
    parts.push(`${d}.${m}.`);
  }
  if (booking.slotStart) parts.push(booking.slotStart);
  return parts.join(' v ');
}

/** Část URL bez úvodního `?` — společné parametry pro /screens/review ze spotlight karty. */
export function getHomeSpotlightReviewQueryString(booking: Booking): string {
  const imageParam = booking.item?.imageUrl
    ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}`
    : '';
  const employeeNameParam = booking.employee?.name
    ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}`
    : '';
  const employeeAvatarParam = booking.employee?.avatarUrl
    ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}`
    : '';
  const [, m, d] = (booking.date ?? '').slice(0, 10).split('-');
  const dateParam = m && d ? `&entityDate=${encodeURIComponent(`${d}.${m}.`)}` : '';
  const timeParam = booking.slotStart ? `&entityTime=${encodeURIComponent(booking.slotStart)}` : '';
  const branchParam = booking.branch?.name
    ? `&entityBranch=${encodeURIComponent(booking.branch.name)}`
    : '';
  return `entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? 'Booking')}${imageParam}${employeeNameParam}${employeeAvatarParam}${dateParam}${timeParam}${branchParam}`;
}

export function getHomeSpotlightReviewPath(booking: Booking, presetRating: number): string {
  return `/screens/review?${getHomeSpotlightReviewQueryString(booking)}&presetRating=${presetRating}`;
}

/** Recenze ke stejné rezervaci bez předvolby hvězd (klik na kartu mimo hvězdy). */
export function getHomeSpotlightReviewScreenPath(booking: Booking): string {
  return `/screens/review?${getHomeSpotlightReviewQueryString(booking)}`;
}
