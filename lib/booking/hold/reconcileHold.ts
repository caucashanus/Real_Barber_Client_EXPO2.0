import type { BookingEntity, BookingSlot } from '@/lib/booking/constants';
import { resolveHoldEmployeeId } from '@/lib/booking/hold/resolveEmployeeId';
import type { BookingHoldState } from '@/lib/booking/hold/types';
import { normalizeBookingSlotStartForMatch } from '@/utils/reservationCreateHelpers';

export type BookingFlowSelectionSnapshot = {
  branchId: string;
  itemId: string;
  date: string;
  slotStart: string;
  resolvedEmployeeId: string;
};

export function buildBookingFlowSelectionSnapshot(params: {
  branchId: string | null | undefined;
  itemId: string | null | undefined;
  date: string | null | undefined;
  slot: BookingSlot | null;
  selectedEmployee: BookingEntity | null;
  profileEmployee: BookingEntity | null;
}): BookingFlowSelectionSnapshot | null {
  const branchId = params.branchId?.trim();
  const itemId = params.itemId?.trim();
  const date = params.date?.trim();
  const slotStart = params.slot?.start?.trim();
  if (!branchId || !itemId || !date || !slotStart) return null;

  const resolvedEmployeeId = resolveHoldEmployeeId(
    params.slot!,
    params.selectedEmployee,
    params.profileEmployee
  );
  if (!resolvedEmployeeId) return null;

  return {
    branchId,
    itemId,
    date,
    slotStart,
    resolvedEmployeeId,
  };
}

export function holdMatchesFlowSelection(
  hold: BookingHoldState,
  selection: BookingFlowSelectionSnapshot
): boolean {
  if (hold.branchId !== selection.branchId) return false;
  if (hold.itemId !== selection.itemId) return false;
  if (hold.date !== selection.date) return false;
  if (normalizeBookingSlotStartForMatch(hold.slotStart) !== normalizeBookingSlotStartForMatch(selection.slotStart)) {
    return false;
  }
  if (hold.employeeId !== selection.resolvedEmployeeId) return false;
  return true;
}

export function isStoredHoldConsistentWithFlow(params: {
  hold: BookingHoldState | null | undefined;
  branchId: string | null | undefined;
  itemId: string | null | undefined;
  date: string | null | undefined;
  slot: BookingSlot | null;
  selectedEmployee: BookingEntity | null;
  profileEmployee: BookingEntity | null;
}): boolean {
  if (!params.hold?.holdId) return false;
  const selection = buildBookingFlowSelectionSnapshot(params);
  if (!selection) return false;
  return holdMatchesFlowSelection(params.hold, selection);
}
