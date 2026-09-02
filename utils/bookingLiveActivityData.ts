import type { Booking } from '@/api/bookings';
import {
  getBookingClientReviewRating,
  getBookingEndDate,
  getBookingStartDate,
  isBookingDuringSlotAt,
  isBookingFutureStartAt,
  isBookingNotCancelled,
} from '@/utils/bookingHelpers';
import { getHomeSpotlightReviewQueryString } from '@/utils/homeSpotlight';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { pickNextWidgetBooking } from '@/utils/widgetBookingData';

export const BOOKING_SOON_MS = 30 * 60 * 1000;
/** Stage 3 (hodnocení) — max doba zobrazení Live Activity po konci slotu. */
export const BOOKING_REVIEW_LINGER_MS = 2 * 60 * 60 * 1000;

export const BOOKING_STAGE_LABELS = [
  'Rezervováno',
  'Brzy začínáme',
  'Probíhá',
  'Ohodnoťte',
] as const;

export type BookingActivityProps = {
  bookingId: string;
  status: string;
  stage: number;
  nowEpochMs: number;
  soonEpochMs: number;
  appointmentEpochMs: number;
  endEpochMs: number;
  branchName?: string;
  employeeName?: string;
  timeLabel?: string;
  logoUri?: string;
  existingReviewRating?: number;
  /** Tap target — lock screen banner uses widgetURL(props); Dynamic Island uses start(url). */
  deepLinkUrl?: string;
};

function buildBookingDeepLink(reservationId: string): string {
  return `realbarber://screens/booking-detail?id=${encodeURIComponent(reservationId)}`;
}

export function isBookingLiveActivityReviewEligible(
  booking: Booking,
  nowMs: number = Date.now()
): boolean {
  if (!isBookingNotCancelled(booking)) return false;
  if (getBookingClientReviewRating(booking) != null) return false;
  const endMs = getBookingEndDate(booking).getTime();
  if (nowMs < endMs) return false;
  return nowMs <= endMs + BOOKING_REVIEW_LINGER_MS;
}

export function computeBookingActivityStage(booking: Booking, nowMs: number = Date.now()): number {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  const soonMs = startMs - BOOKING_SOON_MS;

  if (nowMs >= endMs) return 3;
  if (nowMs >= startMs) return 2;
  if (nowMs >= soonMs) return 1;
  return 0;
}

export function shouldTrackBookingLiveActivity(
  booking: Booking,
  nowMs: number = Date.now()
): boolean {
  return (
    isBookingFutureStartAt(booking, nowMs) ||
    isBookingDuringSlotAt(booking, nowMs) ||
    isBookingLiveActivityReviewEligible(booking, nowMs)
  );
}

export function pickBookingLiveActivityBooking(
  bookings: Booking[],
  nowMs: number = Date.now()
): Booking | null {
  const next = pickNextWidgetBooking(bookings, nowMs);
  if (next && shouldTrackBookingLiveActivity(next, nowMs)) return next;

  const reviewCandidate = bookings
    .filter((booking) => isBookingLiveActivityReviewEligible(booking, nowMs))
    .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())[0];

  return reviewCandidate ?? null;
}

export function buildBookingActivityProps(
  booking: Booking,
  logoUri: string | null,
  nowMs: number = Date.now()
): BookingActivityProps {
  const appointmentMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  const soonMs = appointmentMs - BOOKING_SOON_MS;
  const stage = computeBookingActivityStage(booking, nowMs);
  const existingReviewRating = getBookingClientReviewRating(booking);

  return {
    bookingId: booking.id,
    status: BOOKING_STAGE_LABELS[stage] ?? BOOKING_STAGE_LABELS[0],
    stage,
    nowEpochMs: nowMs,
    soonEpochMs: soonMs,
    appointmentEpochMs: appointmentMs,
    endEpochMs: endMs,
    branchName: booking.branch?.name?.trim() ?? '',
    employeeName: booking.employee?.name?.trim() ?? '',
    timeLabel: formatNextSlotDisplayTime(booking.slotStart),
    logoUri: logoUri ?? undefined,
    existingReviewRating,
    deepLinkUrl: buildBookingActivityDeepLinkForStage(booking, stage),
  };
}

export function buildBookingActivityDeepLink(booking: Booking): string {
  return buildBookingDeepLink(booking.id);
}

export function buildBookingActivityReviewDeepLink(booking: Booking): string {
  return `realbarber://screens/review?${getHomeSpotlightReviewQueryString(booking)}`;
}

export function buildBookingActivityDeepLinkForStage(booking: Booking, stage: number): string {
  return stage >= 3 ? buildBookingActivityReviewDeepLink(booking) : buildBookingActivityDeepLink(booking);
}

export function getBookingActivityStageTimes(booking: Booking): number[] {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  return [startMs - BOOKING_SOON_MS, startMs, endMs, endMs + BOOKING_REVIEW_LINGER_MS];
}

export function getBookingActivityReviewDismissDelayMs(
  booking: Booking,
  nowMs: number = Date.now()
): number {
  const dismissAt = getBookingEndDate(booking).getTime() + BOOKING_REVIEW_LINGER_MS;
  return Math.max(0, dismissAt - nowMs);
}
