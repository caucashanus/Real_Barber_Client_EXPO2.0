import type { Booking } from '@/api/bookings';
import { canShareClientBooking, getBookingStartDate } from '@/utils/bookingHelpers';
import { isKidsHaircutBooking } from '@/utils/isKidsHaircutBooking';

/** Parita web KidsWatchFlow → eligibleBookings. */
export function filterKidsWatchEligibleBookings(bookings: readonly Booking[]): Booking[] {
  return bookings
    .filter((b) => canShareClientBooking(b) && isKidsHaircutBooking(b))
    .sort((a, b) => getBookingStartDate(a).getTime() - getBookingStartDate(b).getTime());
}
