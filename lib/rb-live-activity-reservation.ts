import type { Booking } from '@/api/bookings';
import { type RBLiveActivityPhase, type RBLiveActivityState } from '@/lib/rb-live-activity';
import { buildReservationDetailDeepLink } from '@/utils/pushNavigation';

export type RBLiveActivityCopy = {
  startsInLabel: string;
  activeLabel: string;
  rescheduledLabel: string;
  rescheduledHeadline: string;
  rescheduledDetail: string;
  cancelledLabel: string;
  cancelledHeadline: string;
  cancelledDetail: string;
  reviewLabel: string;
  reviewHeadline: string;
};

export type ReservationLiveActivityDescriptor = {
  bookingId: string;
  deepLink: string;
  state: RBLiveActivityState;
};

export type ReservationLiveActivityHint = {
  bookingId: string;
  startAt: string;
  endAt: string;
  branchName?: string;
  employeeName?: string;
  employeeAvatarUrl?: string;
  detailLine?: string;
  price?: number | null;
};

export function bookingStatusKey(booking: Pick<Booking, 'status'>): string {
  return String(booking.status ?? '')
    .trim()
    .toLowerCase();
}

export function isBookingCancelled(booking: Pick<Booking, 'status'>): boolean {
  const status = bookingStatusKey(booking);
  return status === 'cancelled' || status === 'canceled';
}

export function isBookingCompleted(booking: Pick<Booking, 'status'>): boolean {
  return bookingStatusKey(booking) === 'completed';
}

export function getBookingStartDate(booking: Pick<Booking, 'date' | 'slotStart'>): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

export function getBookingEndDate(booking: Pick<Booking, 'date' | 'slotStart' | 'slotEnd'>): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

export function isBookingCurrent(
  booking: Pick<Booking, 'status' | 'date' | 'slotStart' | 'slotEnd'>,
  nowMs: number = Date.now()
): boolean {
  if (isBookingCancelled(booking)) return false;
  if (isBookingCompleted(booking)) return false;
  const start = getBookingStartDate(booking).getTime();
  const end = getBookingEndDate(booking).getTime();
  return start <= nowMs && end >= nowMs;
}

export function isBookingUpcoming(
  booking: Pick<Booking, 'status' | 'date' | 'slotStart' | 'slotEnd'>,
  nowMs: number = Date.now()
): boolean {
  if (isBookingCancelled(booking)) return false;
  if (isBookingCompleted(booking)) return false;
  return getBookingStartDate(booking).getTime() > nowMs;
}

export function isBookingPast(
  booking: Pick<Booking, 'status' | 'date' | 'slotStart' | 'slotEnd'>,
  nowMs: number = Date.now()
): boolean {
  if (isBookingCancelled(booking)) return false;
  if (isBookingCompleted(booking)) return true;
  return getBookingEndDate(booking).getTime() < nowMs;
}

export function resolveReservationPhase(
  startAtIso: string,
  endAtIso: string,
  nowMs: number = Date.now()
): RBLiveActivityPhase {
  const startMs = new Date(startAtIso).getTime();
  const endMs = new Date(endAtIso).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 'scheduled';
  if (nowMs < startMs) return 'scheduled';
  if (nowMs <= endMs) return 'active';
  return 'finished';
}

export function formatLiveActivityTimeRange(booking: Booking, locale: string): string {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateLocale = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const bookingDay = new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1
  );
  const now = new Date();
  const sameCalendarDay =
    bookingDay.getFullYear() === now.getFullYear() &&
    bookingDay.getMonth() === now.getMonth() &&
    bookingDay.getDate() === now.getDate();
  const timePart = `${booking.slotStart}–${booking.slotEnd}`;
  if (sameCalendarDay) return timePart;
  const dayLabel = bookingDay.toLocaleString(dateLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${dayLabel} · ${timePart}`;
}

export function formatLiveActivityPrice(
  price: number | string | null | undefined,
  locale: string
): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return '';
  const loc = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function pickLiveActivityBooking(
  bookings: Booking[],
  nowMs: number = Date.now()
): Booking | null {
  const current = bookings.find((booking) => isBookingCurrent(booking, nowMs)) ?? null;
  if (current) return current;

  return (
    bookings
      .filter((booking) => isBookingUpcoming(booking, nowMs))
      .map((booking) => ({
        booking,
        startMs: getBookingStartDate(booking).getTime(),
      }))
      .filter(({ startMs }) => startMs - nowMs <= 60 * 60_000 && startMs > nowMs)
      .sort((a, b) => a.startMs - b.startMs)[0]?.booking ?? null
  );
}

export function buildReservationLiveActivityFromBooking(
  booking: Booking,
  options: {
    locale: string;
    accentHex: string;
    copy: RBLiveActivityCopy;
    employeeAvatarUrl?: string;
    employeeAvatarAuthToken?: string;
    nowMs?: number;
    openReview?: boolean;
  }
): ReservationLiveActivityDescriptor {
  const startAt = getBookingStartDate(booking).toISOString();
  const endAt = getBookingEndDate(booking).toISOString();
  const phase = resolveReservationPhase(startAt, endAt, options.nowMs);

  return {
    bookingId: booking.id,
    deepLink: buildReservationDetailDeepLink(booking.id, {
      openReview: options.openReview,
    }),
    state: {
      phase,
      presentation: 'normal',
      labelText: phase === 'active' ? options.copy.activeLabel : options.copy.startsInLabel,
      startAt,
      endAt,
      branchName: booking.branch?.name ?? '',
      timeRangeText: formatLiveActivityTimeRange(booking, options.locale),
      employeeName: booking.employee?.name ?? '',
      employeeAvatarUrl: options.employeeAvatarUrl ?? booking.employee?.avatarUrl ?? '',
      employeeAvatarAuthToken: options.employeeAvatarAuthToken,
      accentHex: options.accentHex,
      priceFormatted: formatLiveActivityPrice(booking.price, options.locale),
    },
  };
}

export function buildReservationLiveActivityFromHint(
  hint: ReservationLiveActivityHint,
  options: {
    locale: string;
    accentHex: string;
    copy: RBLiveActivityCopy;
    employeeAvatarAuthToken?: string;
    nowMs?: number;
  }
): ReservationLiveActivityDescriptor {
  const phase = resolveReservationPhase(hint.startAt, hint.endAt, options.nowMs);
  return {
    bookingId: hint.bookingId,
    deepLink: buildReservationDetailDeepLink(hint.bookingId, { openReview: true }),
    state: {
      phase,
      presentation: 'normal',
      labelText: phase === 'active' ? options.copy.activeLabel : options.copy.startsInLabel,
      startAt: hint.startAt,
      endAt: hint.endAt,
      branchName: hint.branchName ?? '',
      timeRangeText: hint.detailLine ?? '',
      employeeName: hint.employeeName ?? '',
      employeeAvatarUrl: hint.employeeAvatarUrl ?? '',
      employeeAvatarAuthToken: options.employeeAvatarAuthToken,
      accentHex: options.accentHex,
      priceFormatted: formatLiveActivityPrice(hint.price, options.locale),
    },
  };
}

export function buildReservationRescheduledActivity(
  hint: ReservationLiveActivityHint,
  options: {
    locale: string;
    accentHex: string;
    copy: RBLiveActivityCopy;
    employeeAvatarAuthToken?: string;
    nowMs?: number;
  }
): ReservationLiveActivityDescriptor {
  const phase = resolveReservationPhase(hint.startAt, hint.endAt, options.nowMs);
  return {
    bookingId: hint.bookingId,
    deepLink: buildReservationDetailDeepLink(hint.bookingId),
    state: {
      phase,
      presentation: 'rescheduled',
      labelText: options.copy.rescheduledLabel,
      headlineText: options.copy.rescheduledHeadline,
      detailText: options.copy.rescheduledDetail,
      startAt: hint.startAt,
      endAt: hint.endAt,
      branchName: hint.branchName ?? '',
      timeRangeText: hint.detailLine ?? '',
      employeeName: hint.employeeName ?? '',
      employeeAvatarUrl: hint.employeeAvatarUrl ?? '',
      employeeAvatarAuthToken: options.employeeAvatarAuthToken,
      accentHex: options.accentHex,
      priceFormatted: formatLiveActivityPrice(hint.price, options.locale),
    },
  };
}

export function buildReservationCancelledActivity(
  bookingId: string,
  options: {
    startAt: string;
    endAt: string;
    branchName?: string;
    accentHex?: string;
    copy: RBLiveActivityCopy;
  }
): ReservationLiveActivityDescriptor {
  return {
    bookingId,
    deepLink: buildReservationDetailDeepLink(bookingId),
    state: {
      phase: 'finished',
      presentation: 'cancelled',
      labelText: options.copy.cancelledLabel,
      headlineText: options.copy.cancelledHeadline,
      detailText: options.copy.cancelledDetail,
      startAt: options.startAt,
      endAt: options.endAt,
      branchName: options.branchName ?? '',
      timeRangeText: '',
      accentHex: options.accentHex,
    },
  };
}

export function buildReservationReviewActivity(
  bookingId: string,
  options: {
    startAt: string;
    endAt: string;
    branchName?: string;
    accentHex?: string;
    copy: RBLiveActivityCopy;
  }
): ReservationLiveActivityDescriptor {
  return {
    bookingId,
    deepLink: buildReservationDetailDeepLink(bookingId, { openReview: true }),
    state: {
      phase: 'finished',
      presentation: 'review',
      labelText: options.copy.reviewLabel,
      headlineText: options.copy.reviewHeadline,
      startAt: options.startAt,
      endAt: options.endAt,
      branchName: options.branchName ?? '',
      timeRangeText: '',
      accentHex: options.accentHex,
    },
  };
}
