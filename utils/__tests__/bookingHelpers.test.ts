import { describe, expect, it } from 'vitest';

import type { Booking } from '@/api/bookings';
import {
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
});
