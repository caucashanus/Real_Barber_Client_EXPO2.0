import type { Booking } from '@/api/bookings';
import { getBookingEndDate, getBookingStartDate } from '@/utils/bookingHelpers';
import { HOME_SPOTLIGHT_SOON_MS } from '@/utils/homeSpotlight';

/** Stejný práh jako home spotlight „soon“ — Navigovat od ≤60 min před startem do konce slotu. */
export const RESERVATION_DETAIL_NAVIGATE_BEFORE_START_MS = HOME_SPOTLIGHT_SOON_MS;

/**
 * Pill Navigovat u pobočky na detailu rezervace.
 * Mimo okno → Zavolat; uvnitř → Navigovat. Po konci slotu navigace ne.
 */
export function shouldShowClientBookingNavigatePill(
  booking: Booking,
  options?: { nowMs?: number; thresholdMs?: number }
): boolean {
  const nowMs = options?.nowMs ?? Date.now();
  const thresholdMs = options?.thresholdMs ?? RESERVATION_DETAIL_NAVIGATE_BEFORE_START_MS;
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return false;
  if (nowMs > endMs) return false;
  const msUntilStart = startMs - nowMs;
  return msUntilStart <= thresholdMs;
}
