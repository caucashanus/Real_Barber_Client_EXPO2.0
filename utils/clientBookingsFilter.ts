import type { Booking } from '@/api/bookings';
import {
  getBookingClientReviewRating,
  getBookingEndDate,
  getBookingStartDate,
  isBookingCancelledLike,
  isBookingCurrent,
  isBookingMarkedCompleted,
  isBookingPast,
  isBookingUpcoming,
} from '@/utils/bookingHelpers';

export type ClientBookingFilter =
  | 'all'
  | 'current'
  | 'upcoming'
  | 'past'
  | 'cancelled'
  | 'rated'
  | 'pending_review';

function isBookingCancelledFilterMatch(booking: Booking): boolean {
  return isBookingCancelledLike(booking);
}

export function countClientBookingsByFilter(bookings: Booking[]): {
  current: number;
  upcoming: number;
  past: number;
  cancelled: number;
  rated: number;
  pendingReview: number;
} {
  const now = Date.now();
  let current = 0;
  let upcoming = 0;
  let past = 0;
  let cancelled = 0;
  let rated = 0;
  let pendingReview = 0;
  for (const b of bookings) {
    const hasReview = getBookingClientReviewRating(b) != null;
    if (isBookingCancelledLike(b)) {
      cancelled += 1;
    } else if (isBookingMarkedCompleted(b)) {
      past += 1;
      if (hasReview) {
        rated += 1;
      } else {
        pendingReview += 1;
      }
    } else {
      const start = getBookingStartDate(b).getTime();
      const end = getBookingEndDate(b).getTime();
      if (start <= now && end >= now) {
        current += 1;
      } else if (start > now) {
        upcoming += 1;
      } else {
        past += 1;
        if (hasReview) {
          rated += 1;
        } else {
          pendingReview += 1;
        }
      }
    }
  }
  return {
    current,
    upcoming,
    past,
    cancelled,
    rated,
    pendingReview,
  };
}

export function filterClientBookings(
  bookings: Booking[],
  filter: ClientBookingFilter
): Booking[] {
  if (filter === 'all') return bookings;
  if (filter === 'current') return bookings.filter((b) => isBookingCurrent(b));
  if (filter === 'upcoming') return bookings.filter((b) => isBookingUpcoming(b));
  if (filter === 'past') return bookings.filter((b) => isBookingPast(b));
  if (filter === 'cancelled') {
    return bookings.filter(isBookingCancelledFilterMatch);
  }
  if (filter === 'rated') {
    return bookings.filter((b) => isBookingPast(b) && getBookingClientReviewRating(b) != null);
  }
  if (filter === 'pending_review') {
    return bookings.filter((b) => isBookingPast(b) && getBookingClientReviewRating(b) == null);
  }
  return bookings;
}

/** When dynamic filters (current/upcoming) disappear, fall back to all. */
export function normalizeClientBookingFilter(
  filter: ClientBookingFilter,
  counts: { current: number; upcoming: number }
): ClientBookingFilter {
  if (filter === 'current' && counts.current === 0) return 'all';
  if (filter === 'upcoming' && counts.upcoming === 0) return 'all';
  return filter;
}
