import { describe, expect, it } from 'vitest';

import {
  bookingSelectionsReducer,
  EMPTY_BOOKING_SELECTIONS_STATE,
} from '@/lib/booking/engine/bookingSelectionsReducer';

describe('bookingSelectionsReducer SET_BRANCH', () => {
  const withService = {
    ...EMPTY_BOOKING_SELECTIONS_STATE,
    service: { id: 'svc-1', name: 'Haircut' },
    employee: { id: 'emp-1' },
    date: '2026-01-01',
    slot: { start: '10:00', end: '10:30' },
  };

  it('clears service by default when branch changes', () => {
    const next = bookingSelectionsReducer(withService, {
      type: 'SET_BRANCH',
      branch: { id: 'br-2' },
    });
    expect(next.service).toBeNull();
    expect(next.employee).toBeNull();
    expect(next.branch?.id).toBe('br-2');
  });

  it('keeps service when preserveService is set', () => {
    const next = bookingSelectionsReducer(withService, {
      type: 'SET_BRANCH',
      branch: { id: 'br-2' },
      preserveService: true,
    });
    expect(next.service?.id).toBe('svc-1');
    expect(next.employee).toBeNull();
    expect(next.branch?.id).toBe('br-2');
  });
});
