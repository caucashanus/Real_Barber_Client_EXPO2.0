import type { Booking } from '@/api/bookings';
import { getBookingEndDate, isBookingPast } from '@/utils/bookingHelpers';

/** Max. N minulých rezervací — nejnovější podle konce slotu (home „Opakovat“ / Nedávné). */
export function pickRecentHomeBookings(bookings: readonly Booking[], limit = 3): Booking[] {
  const n = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 3;
  return bookings
    .filter(isBookingPast)
    .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
    .slice(0, n);
}
