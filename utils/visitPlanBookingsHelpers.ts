import type { Booking } from '@/api/bookings';
import { getBookingStartDate, isBookingUpcoming } from '@/utils/bookingHelpers';
import { pickRecentHomeBookings } from '@/utils/pickRecentHomeBookings';
import { isoDateLocal } from '@/utils/visitPlanDates';
import {
  VISIT_PLAN_MAIN_PAST_BOOKINGS_LIMIT,
  type VisitPlanPastBooking,
} from '@/utils/visitPlanPastBookingTypes';

export function visitPlanNearestUpcomingBookingDate(
  bookings: readonly Booking[]
): string | null {
  const next = pickVisitPlanUpcomingBookings(bookings)[0];
  if (!next) return null;
  return next.dateIso;
}

export function bookingToVisitPlanPastBooking(booking: Booking): VisitPlanPastBooking {
  const employeeName = booking.employee?.name?.trim() || '—';
  return {
    id: booking.id,
    dateIso: isoDateLocal(getBookingStartDate(booking)),
    time: (booking.slotStart || '').trim().slice(0, 5) || '—',
    employeeName,
    avatarUrl: booking.employee?.avatarUrl?.trim() || null,
    serviceLabel: booking.item?.name?.trim() || '',
    branchLabel: booking.branch?.name?.trim() || '',
    priceCzk: Number.isFinite(booking.price) ? booking.price : 0,
  };
}

function sortUpcomingBookings(bookings: readonly Booking[]): Booking[] {
  return bookings
    .filter(isBookingUpcoming)
    .sort((a, b) => getBookingStartDate(a).getTime() - getBookingStartDate(b).getTime());
}

export function pickVisitPlanUpcomingBookings(
  bookings: readonly Booking[]
): VisitPlanPastBooking[] {
  return sortUpcomingBookings(bookings).map(bookingToVisitPlanPastBooking);
}

export function pickVisitPlanPastBookingsPreview(
  bookings: readonly Booking[],
  limit = VISIT_PLAN_MAIN_PAST_BOOKINGS_LIMIT
): VisitPlanPastBooking[] {
  return pickRecentHomeBookings(bookings, limit).map(bookingToVisitPlanPastBooking);
}

export function findHomeBookingById(
  bookings: readonly Booking[],
  id: string
): Booking | undefined {
  return bookings.find((b) => b.id === id);
}
