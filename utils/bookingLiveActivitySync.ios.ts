import type { Booking } from '@/api/bookings';
import { pickBookingLiveActivityBooking } from '@/utils/bookingLiveActivityData';
import { adoptServerLiveActivitiesForBookings } from '@/utils/liveActivityPushTokens';

/**
 * Server-only Live Activity — CRM vlastní start/update/end přes APNs.
 * App pouze adoptuje běžící LA (CRM C2 start) a registruje C1 push token.
 */
export async function syncBookingLiveActivityFromBookings(bookings: Booking[]): Promise<void> {
  try {
    const next = pickBookingLiveActivityBooking(bookings, Date.now());
    await adoptServerLiveActivitiesForBookings(next?.id ?? null);
  } catch (error) {
    console.warn('[live-activity] adopt failed', error);
  }
}
