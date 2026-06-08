import { describe, expect, it } from 'vitest';

import {
  buildReservationServiceStepCategories,
  employeeNearestSortKey,
  trimParam,
  type ServiceOption,
} from '@/utils/reservationCreateHelpers';

describe('reservationCreateHelpers', () => {
  it('trimParam returns undefined for blank strings', () => {
    expect(trimParam(undefined)).toBeUndefined();
    expect(trimParam('   ')).toBeUndefined();
    expect(trimParam(' branch-1 ')).toBe('branch-1');
  });

  it('sorts employees by nearest slot date and time', () => {
    const nearestMap = new Map([
      [
        'b',
        {
          price: 500,
          nextSlot: {
            date: '2026-06-10',
            slotStart: '10:07',
            slotEnd: '10:37',
            duration: 30,
            branchId: 'branch-1',
          },
        },
      ],
      [
        'a',
        {
          price: 500,
          nextSlot: {
            date: '2026-06-09',
            slotStart: '14:22',
            slotEnd: '14:52',
            duration: 30,
            branchId: 'branch-1',
          },
        },
      ],
    ]);

    expect(employeeNearestSortKey('a', nearestMap, false).startsWith('0|')).toBe(true);
    expect(
      employeeNearestSortKey('a', nearestMap, false) <
        employeeNearestSortKey('b', nearestMap, false)
    ).toBe(true);
    expect(employeeNearestSortKey('z', nearestMap, false).startsWith('2|')).toBe(true);
  });

  it('groups reservation services and hides excluded categories', () => {
    const services: ServiceOption[] = [
      {
        id: '1',
        name: 'Haircut',
        price: 500,
        duration: 30,
        category: { id: 'cat-services', name: 'Služby' },
      },
      {
        id: '2',
        name: 'Color',
        price: 900,
        duration: 60,
        category: { id: 'cat-color', name: 'Barvení' },
      },
      {
        id: '3',
        name: 'Package',
        price: 1200,
        duration: 90,
        category: { id: 'cat-pack', name: 'Balíčky' },
      },
    ];

    const groups = buildReservationServiceStepCategories(services, 'Other');
    expect(groups.map((g) => g.name)).toEqual(['Služby', 'Balíčky']);
    expect(groups.flatMap((g) => g.services.map((s) => s.id))).toEqual(['1', '3']);
  });
});
