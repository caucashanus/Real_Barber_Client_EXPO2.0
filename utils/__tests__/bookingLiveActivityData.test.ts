import { describe, expect, it, vi } from 'vitest';

import type { Booking } from '@/api/bookings';

vi.mock('@/utils/homeSpotlight', () => ({
  getHomeSpotlightReviewQueryString: (booking: { id: string }) =>
    `entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=St%C5%99ih&entityDate=16.%206.&entityTime=10%3A00&entityBranch=Mod%C5%99any`,
}));

import {
  BOOKING_STAGE_LABELS,
  buildBookingActivityDeepLinkForStage,
  buildBookingActivityProps,
  computeBookingActivityStage,
} from '@/utils/bookingLiveActivityData';

function makeBooking(overrides: Partial<Booking> & Pick<Booking, 'id' | 'date' | 'slotStart'>): Booking {
  return {
    clientId: 'c1',
    employeeId: 'e1',
    branchId: 'b1',
    itemId: 'i1',
    slotEnd: '11:00',
    duration: 60,
    price: 500,
    status: 'scheduled',
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
    employee: { id: 'e1', name: 'Jan Novák' },
    branch: { id: 'b1', name: 'Modřany' },
    item: { id: 'i1', name: 'Střih', imageUrl: 'https://example.com/strih.jpg' },
    ...overrides,
  };
}

describe('buildBookingActivityProps', () => {
  it('builds stage 0 props with booking-detail deep link', () => {
    const now = new Date('2026-06-16T09:00:00').getTime();
    const booking = makeBooking({ id: 'res-1', date: '2026-06-16', slotStart: '15:07' });
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.bookingId).toBe('res-1');
    expect(props.stage).toBe(0);
    expect(props.status).toBe(BOOKING_STAGE_LABELS[0]);
    expect(props.timeLabel).toBe('15:15');
    expect(props.soonEpochMs).toBe(props.appointmentEpochMs - 30 * 60 * 1000);
    expect(props.deepLinkUrl).toBe('realbarber://screens/booking-detail?id=res-1');
    expect(props.branchName).toBe('Modřany');
    expect(props.employeeName).toBe('Jan Novák');
  });

  it('builds stage 3 review deep link with CS entityDate and raw entityTime', () => {
    const now = new Date('2026-06-16T11:30:00').getTime();
    const booking = makeBooking({ id: 'res-2', date: '2026-06-16', slotStart: '10:00', slotEnd: '11:00' });
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(3);
    expect(props.status).toBe('Ohodnoťte');
    expect(props.deepLinkUrl).toContain('realbarber://screens/review?');
    expect(props.deepLinkUrl).toContain('entityType=reservation');
    expect(props.deepLinkUrl).toContain('entityId=res-2');
    expect(props.deepLinkUrl).toContain('entityTime=10%3A00');
    expect(props.deepLinkUrl).toContain('entityDate=16.%206.');
    expect(props.deepLinkUrl).toContain('entityBranch=Mod%C5%99any');
  });
});

describe('computeBookingActivityStage', () => {
  it('maps timeline boundaries to stages', () => {
    const booking = makeBooking({ id: 'x', date: '2026-06-16', slotStart: '10:00', slotEnd: '11:00' });
    const start = new Date('2026-06-16T09:00:00').getTime();
    const soon = new Date('2026-06-16T09:30:00').getTime();
    const during = new Date('2026-06-16T10:30:00').getTime();
    const review = new Date('2026-06-16T11:30:00').getTime();

    expect(computeBookingActivityStage(booking, start)).toBe(0);
    expect(computeBookingActivityStage(booking, soon)).toBe(1);
    expect(computeBookingActivityStage(booking, during)).toBe(2);
    expect(computeBookingActivityStage(booking, review)).toBe(3);
  });
});

describe('buildBookingActivityDeepLinkForStage', () => {
  it('switches deep link at stage 3', () => {
    const booking = makeBooking({ id: 'res-3', date: '2026-06-16', slotStart: '10:00' });
    expect(buildBookingActivityDeepLinkForStage(booking, 2)).toContain('booking-detail');
    expect(buildBookingActivityDeepLinkForStage(booking, 3)).toContain('/screens/review');
  });
});
