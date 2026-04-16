import type { Booking } from '@/api/bookings';

function isNotCancelled(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  return status !== 'cancelled' && status !== 'canceled';
}

export function getBookingStartDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

export function getBookingEndDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

/** @deprecated Use getBookingStartDate */
export const getTargetDate = getBookingStartDate;

export function isBookingUpcoming(booking: Booking): boolean {
  if (!isNotCancelled(booking)) return false;
  return getBookingStartDate(booking).getTime() > Date.now();
}

export function isBookingCurrent(booking: Booking): boolean {
  if (!isNotCancelled(booking)) return false;
  const now = Date.now();
  return getBookingStartDate(booking).getTime() <= now && getBookingEndDate(booking).getTime() >= now;
}

export function isBookingPast(booking: Booking): boolean {
  if (!isNotCancelled(booking)) return false;
  return getBookingEndDate(booking).getTime() < Date.now();
}
