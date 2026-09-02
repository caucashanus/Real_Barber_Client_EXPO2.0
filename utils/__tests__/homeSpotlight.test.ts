import { describe, expect, it, vi } from 'vitest';

import type { Booking } from '@/api/bookings';

vi.mock('@/utils/bookingDetailHelpers', () => ({
  buildReservationReviewContextQuery: () => '',
}));

import { pickHomeSpotlight, pickHomeSpotlightReviewBooking } from '@/utils/homeSpotlight';

function makeBooking(
  overrides: Partial<Booking> & Pick<Booking, 'id' | 'date' | 'slotStart' | 'slotEnd'>
): Booking {
  return {
    clientId: 'c1',
    employeeId: 'e1',
    branchId: 'b1',
    itemId: 'i1',
    duration: 60,
    price: 500,
    status: 'completed',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
    employee: { id: 'e1', name: 'Jan' },
    branch: { id: 'b1', name: 'Modřany' },
    item: { id: 'i1', name: 'Střih' },
    ...overrides,
  };
}

describe('pickHomeSpotlightReviewBooking', () => {
  it('returns only the latest past visit without review', () => {
    const now = new Date('2026-06-20T12:00:00').getTime();
    const older = makeBooking({
      id: 'old',
      date: '2026-06-10',
      slotStart: '10:00',
      slotEnd: '11:00',
    });
    const newer = makeBooking({
      id: 'new',
      date: '2026-06-19',
      slotStart: '10:00',
      slotEnd: '11:00',
    });

    expect(pickHomeSpotlightReviewBooking([older, newer], now)?.id).toBe('new');
  });

  it('returns null when latest visit is already reviewed (no older backlog on home)', () => {
    const now = new Date('2026-06-20T12:00:00').getTime();
    const older = makeBooking({
      id: 'old',
      date: '2026-06-10',
      slotStart: '10:00',
      slotEnd: '11:00',
    });
    const newer = makeBooking({
      id: 'new',
      date: '2026-06-19',
      slotStart: '10:00',
      slotEnd: '11:00',
      clientReview: { hasReview: true, rating: 5 },
    });

    expect(pickHomeSpotlightReviewBooking([older, newer], now)).toBeNull();
  });
});

describe('pickHomeSpotlight', () => {
  it('does not show review card for older backlog after latest visit is reviewed', () => {
    const now = new Date('2026-06-20T12:00:00').getTime();
    const bookings = [
      makeBooking({
        id: 'old',
        date: '2026-06-10',
        slotStart: '10:00',
        slotEnd: '11:00',
      }),
      makeBooking({
        id: 'new',
        date: '2026-06-19',
        slotStart: '10:00',
        slotEnd: '11:00',
        clientReview: { hasReview: true, rating: 4 },
      }),
    ];

    expect(pickHomeSpotlight(bookings, now)).toBeNull();
  });
});
