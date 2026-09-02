import type { Booking } from '@/api/bookings';

/** Android — Live Activity není podporována. */
export async function syncBookingLiveActivityFromBookings(_bookings: Booking[]): Promise<void> {}
