import { describe, expect, it } from 'vitest';

import type { Booking } from '@/api/bookings';
import {
  buildWidgetBookingProps,
  pickNextWidgetBooking,
} from '@/utils/widgetBookingData';

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
    item: { id: 'i1', name: 'Střih' },
    ...overrides,
  };
}

describe('pickNextWidgetBooking', () => {
  it('returns nearest future booking', () => {
    const now = new Date('2026-06-16T10:00:00').getTime();
    const bookings = [
      makeBooking({ id: 'later', date: '2026-06-20', slotStart: '10:00' }),
      makeBooking({ id: 'soon', date: '2026-06-16', slotStart: '14:00' }),
    ];
    expect(pickNextWidgetBooking(bookings, now)?.id).toBe('soon');
  });

  it('prefers in-progress booking over future ones', () => {
    const now = new Date('2026-06-16T10:30:00').getTime();
    const bookings = [
      makeBooking({ id: 'future', date: '2026-06-16', slotStart: '14:00' }),
      makeBooking({ id: 'now', date: '2026-06-16', slotStart: '10:00', slotEnd: '11:00' }),
    ];
    expect(pickNextWidgetBooking(bookings, now)?.id).toBe('now');
  });
});

describe('buildWidgetBookingProps', () => {
  it('builds lock screen line and deep link', () => {
    const now = new Date('2026-06-16T10:00:00').getTime();
    const props = buildWidgetBookingProps(
      makeBooking({ id: 'abc-123', date: '2026-06-16', slotStart: '14:30' }),
      now
    );

    expect(props.hasBooking).toBe(true);
    expect(props.branchName).toBe('Modřany');
    expect(props.timeLabel).toBe('14:30');
    expect(props.lockScreenLine).toContain('Real Barber');
    expect(props.lockScreenLine).toContain('Modřany');
    expect(props.deepLinkUrl).toBe('realbarber://screens/booking-detail?id=abc-123');
  });
});
