import type { Booking } from '@/api/bookings';
import {
  getBookingEndDate,
  getBookingStartDate,
  isBookingDuringSlotAt,
  isBookingFutureStartAt,
} from '@/utils/bookingHelpers';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { pickNextWidgetBooking } from '@/utils/widgetBookingData';

export const BOOKING_SOON_MS = 30 * 60 * 1000;
export const BOOKING_DONE_LINGER_MS = 3 * 1000;

export const BOOKING_STAGE_LABELS = [
  'Rezervováno',
  'Brzy termín',
  'Právě teď',
  'Hotovo',
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
};

function buildBookingDeepLink(reservationId: string): string {
  return `realbarber://screens/booking-detail?id=${encodeURIComponent(reservationId)}`;
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
  return isBookingFutureStartAt(booking, nowMs) || isBookingDuringSlotAt(booking, nowMs);
}

export function pickBookingLiveActivityBooking(
  bookings: Booking[],
  nowMs: number = Date.now()
): Booking | null {
  const next = pickNextWidgetBooking(bookings, nowMs);
  if (!next) return null;
  if (!shouldTrackBookingLiveActivity(next, nowMs)) return null;
  return next;
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
  };
}

export function buildBookingActivityDeepLink(booking: Booking): string {
  return buildBookingDeepLink(booking.id);
}

export function getBookingActivityStageTimes(booking: Booking): number[] {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  return [startMs - BOOKING_SOON_MS, startMs, endMs, endMs + BOOKING_DONE_LINGER_MS];
}
