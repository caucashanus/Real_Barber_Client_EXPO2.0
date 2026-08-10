import { describe, expect, it } from 'vitest';

import type { Booking } from '@/api/bookings';
import {
  canShareClientBooking,
  isBookingMarkedCompleted,
  isBookingNotCancelled,
  isBookingUpcoming,
} from '@/utils/bookingHelpers';

function booking(partial: Partial<Booking> & Pick<Booking, 'id'>): Booking {
  return {
    date: partial.date ?? '2026-06-01',
    slotStart: partial.slotStart ?? '10:00',
    slotEnd: partial.slotEnd ?? '10:30',
    status: partial.status ?? 'confirmed',
    ...partial,
    id: partial.id,
  } as Booking;
}

describe('bookingHelpers', () => {
  it('detects cancelled bookings', () => {
    expect(isBookingNotCancelled(booking({ id: '1', status: 'cancelled' }))).toBe(false);
    expect(isBookingNotCancelled(booking({ id: '2', status: 'confirmed' }))).toBe(true);
  });

  it('detects completed status synonyms', () => {
    expect(isBookingMarkedCompleted(booking({ id: '1', status: 'completed' }))).toBe(true);
    expect(isBookingMarkedCompleted(booking({ id: '2', status: 'confirmed' }))).toBe(false);
  });

  it('classifies future slot as upcoming when not completed', () => {
    const future = booking({
      id: '1',
      date: '2099-01-01',
      slotStart: '10:00',
      slotEnd: '10:30',
      status: 'confirmed',
    });
    expect(isBookingUpcoming(future)).toBe(true);
  });

  it('allows share only for upcoming or current slots', () => {
    const at = new Date('2026-08-10T16:15:00').getTime();
    const upcoming = booking({
      id: 'up',
      date: '2026-08-10',
      slotStart: '18:00',
      slotEnd: '18:30',
    });
    const current = booking({
      id: 'cur',
      date: '2026-08-10',
      slotStart: '16:00',
      slotEnd: '17:00',
    });
    const past = booking({
      id: 'past',
      date: '2026-08-10',
      slotStart: '10:00',
      slotEnd: '11:00',
    });
    expect(canShareClientBooking(upcoming, at)).toBe(true);
    expect(canShareClientBooking(current, at)).toBe(true);
    expect(canShareClientBooking(past, at)).toBe(false);
    expect(canShareClientBooking(booking({ id: 'c', status: 'cancelled' }), at)).toBe(false);
    expect(canShareClientBooking(booking({ id: 'd', status: 'completed' }), at)).toBe(false);
  });
});
