import { describe, expect, it } from 'vitest';

import { ANY_EMPLOYEE_ID } from '@/lib/booking/constants';
import {
  getBookingSubmitBlockReason,
  resolveSummaryEmployeeDisplayName,
} from '@/lib/booking/submitReadiness';

describe('submitReadiness', () => {
  it('blocks submit when barber cannot be resolved', () => {
    expect(
      getBookingSubmitBlockReason({
        bookingContactReady: true,
        hold: {
          holdId: 'hold-1',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          branchId: 'b1',
          itemId: 's1',
          employeeId: 'emp-1',
          date: '2026-09-25',
          slotStart: '11:30',
          slotEnd: '12:45',
        },
        branchId: 'b1',
        itemId: 's1',
        date: '2026-09-25',
        selectedSlot: { start: '11:30', end: '12:45' },
        selectedEmployee: { id: ANY_EMPLOYEE_ID, name: 'Anyone' },
        profileEmployee: null,
      })
    ).toBe('employee');
  });

  it('blocks submit when hold does not match current selection', () => {
    expect(
      getBookingSubmitBlockReason({
        bookingContactReady: true,
        hold: {
          holdId: 'hold-1',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          branchId: 'b1',
          itemId: 's1',
          employeeId: 'emp-1',
          date: '2026-09-25',
          slotStart: '11:30',
          slotEnd: '12:45',
        },
        branchId: 'b1',
        itemId: 's1',
        date: '2026-09-25',
        selectedSlot: { start: '12:00', end: '13:00', employeeId: 'emp-1' },
        selectedEmployee: { id: 'emp-1', name: 'Káťa' },
        profileEmployee: null,
      })
    ).toBe('hold');
  });

  it('resolves barber label from slot employeeId', () => {
    const name = resolveSummaryEmployeeDisplayName({
      selectedEmployee: null,
      profileEmployee: null,
      selectedSlot: { start: '11:30', end: '12:45', employeeId: 'emp-1' },
      employees: [{ id: 'emp-1', name: 'Káťa' }],
    });
    expect(name).toBe('Káťa');
  });
});
