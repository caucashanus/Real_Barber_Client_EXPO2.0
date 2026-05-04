import type { Booking } from '@/api/bookings';

let snapshot: { booking: Booking; idNorm: string } | null = null;

/** Uloží rezervaci hned po vytvoření — detail pak přežije prodlevu indexu v GET /reservations. */
export function setFreshBookingSnapshot(booking: Booking): void {
  snapshot = {
    booking,
    idNorm: String(booking.id).trim().toLowerCase(),
  };
}

export function peekFreshBookingSnapshot(bookingId: string): Booking | null {
  const bid = String(bookingId).trim().toLowerCase();
  if (!snapshot || snapshot.idNorm !== bid) return null;
  return snapshot.booking;
}

export function clearFreshBookingSnapshotIfMatches(bookingId: string): void {
  const bid = String(bookingId).trim().toLowerCase();
  if (snapshot && snapshot.idNorm === bid) snapshot = null;
}
