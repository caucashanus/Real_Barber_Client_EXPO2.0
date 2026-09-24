import { describe, expect, it } from 'vitest';

import {
  buildBookingFlowSelectionSnapshot,
  holdMatchesFlowSelection,
} from '@/lib/booking/hold/reconcileHold';

describe('reconcileHold', () => {
  it('builds snapshot with concrete employee from slot', () => {
    const snapshot = buildBookingFlowSelectionSnapshot({
      branchId: 'b1',
      itemId: 's1',
      date: '2026-09-25',
      slot: { start: '11:30', end: '12:45', employeeId: 'emp-2' },
      selectedEmployee: { id: 'any', name: 'Anyone' },
      profileEmployee: null,
    });
    expect(snapshot?.resolvedEmployeeId).toBe('emp-2');
  });

  it('detects hold mismatch on slot time', () => {
    const selection = {
      branchId: 'b1',
      itemId: 's1',
      date: '2026-09-25',
      slotStart: '12:00',
      resolvedEmployeeId: 'emp-1',
    };
    expect(
      holdMatchesFlowSelection(
        {
          holdId: 'h',
          expiresAt: new Date().toISOString(),
          branchId: 'b1',
          itemId: 's1',
          employeeId: 'emp-1',
          date: '2026-09-25',
          slotStart: '11:30',
          slotEnd: '12:45',
        },
        selection
      )
    ).toBe(false);
  });
});
