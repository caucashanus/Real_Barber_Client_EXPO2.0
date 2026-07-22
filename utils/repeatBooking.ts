import type { Booking } from '@/api/bookings';
import { buildBookingEngineHref } from '@/lib/booking/engine/resolvePresetFromParams';
import {
  getBookingEndDate,
  isBookingDuringSlotAt,
  isBookingFutureStartAt,
} from '@/utils/bookingHelpers';

/** Min. počet dní po konci slotu dokončené rezervace, než nabídneme opakování. */
export const REPEAT_BOOKING_MIN_DAYS_AFTER_COMPLETED = 4;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isBookingStrictlyCompleted(booking: Booking): boolean {
  return (booking.status ?? '').trim().toLowerCase() === 'completed';
}

export function getDaysSinceBookingEnded(booking: Booking, nowMs: number = Date.now()): number {
  const endMs = getBookingEndDate(booking).getTime();
  if (!Number.isFinite(endMs)) return -1;
  return Math.floor((nowMs - endMs) / MS_PER_DAY);
}

export function isRepeatBookingEligible(
  booking: Booking,
  nowMs: number = Date.now(),
  minDaysAfterCompleted: number = REPEAT_BOOKING_MIN_DAYS_AFTER_COMPLETED
): boolean {
  if (!isBookingStrictlyCompleted(booking)) return false;
  if (!booking.branchId?.trim() || !booking.employeeId?.trim() || !booking.itemId?.trim()) {
    return false;
  }
  return getDaysSinceBookingEnded(booking, nowMs) >= minDaysAfterCompleted;
}

/** Klient má naplánovanou nebo právě probíhající rezervaci — opakování minulé se neukazuje. */
export function hasClientFutureReservation(
  bookings: Booking[],
  nowMs: number = Date.now()
): boolean {
  return bookings.some(
    (booking) =>
      isBookingFutureStartAt(booking, nowMs) || isBookingDuringSlotAt(booking, nowMs)
  );
}

/**
 * Nejnovější dokončená rezervace vhodná k opakování (status přesně `completed`, ≥4 dny od konce slotu).
 * Nevrátí nic, pokud klient už má budoucí nebo probíhající rezervaci.
 */
export function pickRepeatBookingCandidate(
  bookings: Booking[],
  nowMs: number = Date.now(),
  minDaysAfterCompleted: number = REPEAT_BOOKING_MIN_DAYS_AFTER_COMPLETED
): Booking | null {
  if (hasClientFutureReservation(bookings, nowMs)) return null;

  let best: Booking | null = null;
  let bestEndMs = -1;

  for (const booking of bookings) {
    if (!isRepeatBookingEligible(booking, nowMs, minDaysAfterCompleted)) continue;
    const endMs = getBookingEndDate(booking).getTime();
    if (endMs > bestEndMs) {
      best = booking;
      bestEndMs = endMs;
    }
  }

  return best;
}

export function buildRepeatReservationHref(booking: Booking): string {
  return buildBookingEngineHref({
    recipe: 'branch-first',
    branchId: booking.branchId,
    employeeId: booking.employeeId,
    itemId: booking.itemId,
    itemName: booking.item?.name?.trim(),
  });
}

export function formatRepeatBookingSubtitle(booking: Booking): string {
  const parts = [
    booking.item?.name?.trim(),
    booking.employee?.name?.trim(),
    booking.branch?.name?.trim(),
  ].filter(Boolean);
  return parts.join(' · ');
}
