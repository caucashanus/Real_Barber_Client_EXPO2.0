import { describe, expect, it } from 'vitest';

import type { Booking } from '@/api/bookings';
import { KIDS_HAIRCUT_CRM_ITEM_ID } from '@/constants/kidsHaircutBooking';
import { filterKidsWatchEligibleBookings } from '@/utils/kidsWatchEligibleBookings';

function mockBooking(overrides: Partial<Booking> & Pick<Booking, 'id'>): Booking {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const date = tomorrow.toISOString().slice(0, 10);
  return {
    id: overrides.id,
    clientId: 'c1',
    employeeId: 'e1',
    branchId: 'b1',
    itemId: overrides.itemId ?? KIDS_HAIRCUT_CRM_ITEM_ID,
    date: overrides.date ?? date,
    slotStart: overrides.slotStart ?? '10:00',
    slotEnd: overrides.slotEnd ?? '10:30',
    duration: 30,
    price: 500,
    status: overrides.status ?? 'scheduled',
    createdAt: '',
    updatedAt: '',
    employee: { id: 'e1', name: 'Barber' },
    branch: { id: 'b1', name: 'Branch' },
    item: {
      id: overrides.item?.id ?? overrides.itemId ?? KIDS_HAIRCUT_CRM_ITEM_ID,
      name: overrides.item?.name ?? 'Kids cut',
    },
    ...overrides,
  };
}

describe('filterKidsWatchEligibleBookings', () => {
  it('keeps only shareable kids haircuts sorted by start', () => {
    const kidsLater = mockBooking({ id: '1', slotStart: '14:00' });
    const kidsSoon = mockBooking({ id: '2', slotStart: '09:00' });
    const adult = mockBooking({
      id: '3',
      itemId: 'd557b4b5-5b26-4650-bdbe-0ed45f1acf95',
    });
    const past = mockBooking({
      id: '4',
      date: '2020-01-01',
      slotStart: '10:00',
      slotEnd: '10:30',
    });

    const result = filterKidsWatchEligibleBookings([kidsLater, adult, past, kidsSoon]);
    expect(result.map((b) => b.id)).toEqual(['2', '1']);
  });
});
