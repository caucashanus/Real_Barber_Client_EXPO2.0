import { describe, expect, it } from 'vitest';

import type { Booking } from '@/api/bookings';
import {
  hasClientFutureReservation,
  pickRepeatBookingCandidate,
  REPEAT_BOOKING_MIN_DAYS_AFTER_COMPLETED,
} from '@/utils/repeatBooking';

function booking(partial: Partial<Booking> & Pick<Booking, 'id'>): Booking {
  return {
    date: partial.date ?? '2026-06-01',
    slotStart: partial.slotStart ?? '10:00',
    slotEnd: partial.slotEnd ?? '10:30',
    status: partial.status ?? 'scheduled',
    branchId: partial.branchId ?? 'branch-1',
    employeeId: partial.employeeId ?? 'emp-1',
    itemId: partial.itemId ?? 'item-1',
    ...partial,
    id: partial.id,
  } as Booking;
}

const NOW = new Date('2026-06-10T12:00:00').getTime();
const MIN_DAYS = REPEAT_BOOKING_MIN_DAYS_AFTER_COMPLETED;

describe('repeatBooking', () => {
  it('detects future and in-progress reservations', () => {
    expect(
      hasClientFutureReservation(
        [booking({ id: '1', date: '2026-06-15', status: 'scheduled' })],
        NOW
      )
    ).toBe(true);
    expect(
      hasClientFutureReservation(
        [
          booking({
            id: '1',
            date: '2026-06-10',
            slotStart: '11:30',
            slotEnd: '12:30',
            status: 'scheduled',
          }),
        ],
        NOW
      )
    ).toBe(true);
    expect(
      hasClientFutureReservation(
        [
          booking({
            id: '1',
            date: '2026-06-01',
            status: 'completed',
          }),
        ],
        NOW
      )
    ).toBe(false);
  });

  it('returns eligible completed booking when client has no future reservation', () => {
    const completed = booking({
      id: 'past',
      date: '2026-06-01',
      status: 'completed',
    });

    expect(pickRepeatBookingCandidate([completed], NOW, MIN_DAYS)?.id).toBe('past');
  });

  it('returns null when client has a future reservation', () => {
    const completed = booking({
      id: 'past',
      date: '2026-06-01',
      status: 'completed',
    });
    const future = booking({
      id: 'future',
      date: '2026-06-20',
      status: 'scheduled',
    });

    expect(pickRepeatBookingCandidate([completed, future], NOW, MIN_DAYS)).toBeNull();
  });

  it('returns null when client is currently in a slot', () => {
    const completed = booking({
      id: 'past',
      date: '2026-06-01',
      status: 'completed',
    });
    const current = booking({
      id: 'now',
      date: '2026-06-10',
      slotStart: '11:00',
      slotEnd: '12:30',
      status: 'scheduled',
    });

    expect(pickRepeatBookingCandidate([completed, current], NOW, MIN_DAYS)).toBeNull();
  });
});
