import type { BookingEntity, BookingSlot } from '@/lib/booking/constants';
import { isStoredHoldConsistentWithFlow } from '@/lib/booking/hold/reconcileHold';
import { resolveHoldEmployeeId } from '@/lib/booking/hold/resolveEmployeeId';
import type { BookingHoldState } from '@/lib/booking/hold/types';

export type BookingSubmitBlockReason = 'contact' | 'hold' | 'employee' | 'slot' | null;

export function getBookingSubmitBlockReason(params: {
  bookingContactReady: boolean;
  hold: BookingHoldState | null | undefined;
  branchId: string | null | undefined;
  itemId: string | null | undefined;
  date: string | null | undefined;
  selectedSlot: BookingSlot | null;
  selectedEmployee: BookingEntity | null;
  profileEmployee: BookingEntity | null;
}): BookingSubmitBlockReason {
  if (!params.bookingContactReady) return 'contact';
  if (!params.selectedSlot?.start?.trim()) return 'slot';

  const employeeId = resolveHoldEmployeeId(
    params.selectedSlot,
    params.selectedEmployee,
    params.profileEmployee
  );

  if (!employeeId) return 'employee';
  if (!params.hold?.holdId?.trim()) return 'hold';

  if (
    !isStoredHoldConsistentWithFlow({
      hold: params.hold,
      branchId: params.branchId,
      itemId: params.itemId,
      date: params.date,
      slot: params.selectedSlot,
      selectedEmployee: params.selectedEmployee,
      profileEmployee: params.profileEmployee,
    })
  ) {
    return 'hold';
  }

  return null;
}

export function resolveSummaryEmployeeDisplayName(params: {
  selectedEmployee: BookingEntity | null;
  profileEmployee: BookingEntity | null;
  selectedSlot: BookingSlot | null;
  holdEmployeeId?: string | null;
  employees: BookingEntity[];
}): string {
  const direct = params.selectedEmployee ?? params.profileEmployee;
  const directName = direct?.displayName?.trim() || direct?.name?.trim();
  if (directName) return directName;

  const employeeId =
    params.holdEmployeeId?.trim() || params.selectedSlot?.employeeId?.trim();
  if (!employeeId) return '—';

  const fromList = params.employees.find((row) => row.id === employeeId);
  const listName = fromList?.displayName?.trim() || fromList?.name?.trim();
  return listName || '—';
}
