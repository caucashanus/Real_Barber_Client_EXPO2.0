import { describe, expect, it, vi } from 'vitest';

import type { Booking } from '@/api/bookings';

vi.mock('@/utils/bookingDetailHelpers', () => ({
  buildReservationReviewContextQuery: () => '',
}));

vi.mock('@/utils/branchNavigationUrls', () => ({
  getBranchNavigateMapsQuery: () => 'maps-query',
}));

vi.mock('@/utils/isKidsHaircutBooking', () => ({
  isKidsHaircutBooking: () => false,
}));

import { resolveClientBookingSpotlightPresentation } from '@/utils/clientBookingSpotlightPresentation';

function baseBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    clientId: 'c1',
    employeeId: 'e1',
    branchId: 'br1',
    itemId: 'i1',
    date: '2026-12-01',
    slotStart: '10:00',
    slotEnd: '10:30',
    duration: 30,
    price: 500,
    status: 'scheduled',
    createdAt: '',
    updatedAt: '',
    employee: { id: 'e1', name: 'Jan' },
    branch: { id: 'br1', name: 'Modřany', address: 'Praha' },
    item: { id: 'i1', name: 'Střih' },
    couponUsages: [],
    ...overrides,
  };
}

describe('resolveClientBookingSpotlightPresentation', () => {
  it('confirmed start in 30 min → soon (not lifecycle_confirmed)', () => {
    const start = new Date();
    start.setMinutes(start.getMinutes() + 30);
    const date = start.toISOString().slice(0, 10);
    const slotStart = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const booking = baseBooking({
      date,
      slotStart,
      slotEnd: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes() + 30).padStart(2, '0')}`,
      manage: {
        lifecycle: 'confirmed',
        allowedActions: [],
        canManage: true,
        message: null,
      },
    });
    const nowMs = Date.now();
    const p = resolveClientBookingSpotlightPresentation(booking, nowMs);
    expect(p.phase).toBe('soon');
    expect(p.showHeaderCountdownPill).toBe(true);
    expect(p.actions.navigate).toBe(true);
  });

  it('confirmed start in 3 days → lifecycle_confirmed', () => {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    start.setHours(14, 0, 0, 0);
    const booking = baseBooking({
      date: start.toISOString().slice(0, 10),
      slotStart: '14:00',
      slotEnd: '14:30',
      manage: {
        lifecycle: 'confirmed',
        allowedActions: [],
        canManage: true,
        message: null,
      },
    });
    const p = resolveClientBookingSpotlightPresentation(booking, Date.now());
    expect(p.phase).toBe('lifecycle_confirmed');
    expect(p.showHeaderCountdownPill).toBe(false);
    expect(p.statusDot).toBe('green');
  });
});
