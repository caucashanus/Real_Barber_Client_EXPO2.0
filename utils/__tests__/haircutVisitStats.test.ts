import { describe, expect, it } from 'vitest';

import type { Booking } from '@/api/bookings';
import {
  computeHaircutVisitStats,
  daysBetweenDates,
  visitStatusFromDaysSince,
} from '@/utils/haircutVisitStats';

function pastBooking(id: string, date: string): Booking {
  return {
    id,
    clientId: 'c1',
    employeeId: 'e1',
    branchId: 'b1',
    itemId: 'i1',
    date,
    slotStart: '10:00',
    slotEnd: '10:30',
    duration: 30,
    price: 500,
    status: 'completed',
    createdAt: date,
    updatedAt: date,
    employee: { id: 'e1', name: 'Barber' },
    branch: { id: 'b1', name: 'Branch' },
    item: { id: 'i1', name: 'Cut' },
  };
}

describe('haircutVisitStats', () => {
  it('computes intervals between past visits', () => {
    const stats = computeHaircutVisitStats(
      [
        pastBooking('1', '2026-01-12'),
        pastBooking('2', '2026-02-09'),
        pastBooking('3', '2026-03-12'),
      ],
      new Date('2026-04-07T12:00:00').getTime()
    );

    expect(stats.hasEnoughData).toBe(true);
    expect(stats.intervals).toEqual([28, 31]);
    expect(stats.intervalLabels).toEqual(['1→2', '2→3']);
    expect(stats.averageInterval).toBe(30);
    expect(stats.longestPause).toBe(31);
    expect(stats.daysSinceLastVisit).toBe(26);
    expect(stats.recommendedInDays).toBe(4);
    expect(stats.status).toBe('ok');
  });

  it('requires at least two visits for chart data', () => {
    const stats = computeHaircutVisitStats(
      [pastBooking('1', '2026-01-12')],
      new Date('2026-02-01').getTime()
    );
    expect(stats.hasEnoughData).toBe(false);
    expect(stats.intervals).toEqual([]);
  });

  it('classifies visit status by days since last visit', () => {
    expect(visitStatusFromDaysSince(25)).toBe('ok');
    expect(visitStatusFromDaysSince(35)).toBe('approaching');
    expect(visitStatusFromDaysSince(45)).toBe('overdue');
  });

  it('counts whole calendar days between dates', () => {
    const a = new Date(2026, 0, 12);
    const b = new Date(2026, 1, 9);
    expect(daysBetweenDates(a, b)).toBe(28);
  });
});
