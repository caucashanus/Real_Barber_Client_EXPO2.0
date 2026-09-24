import type { BookingEntity, BookingSlot } from '@/lib/booking/constants';
import { isAnyEmployeeId } from '@/lib/booking/domain/anyEmployee';

export function resolveHoldEmployeeId(
  slot: Pick<BookingSlot, 'employeeId'>,
  employee: BookingEntity | null | undefined,
  profileEmployee: BookingEntity | null | undefined
): string | null {
  const fromSlot = slot.employeeId?.trim();
  if (fromSlot && !isAnyEmployeeId(fromSlot)) {
    return fromSlot;
  }

  const resolved = profileEmployee ?? employee;
  if (!resolved?.id || isAnyEmployeeId(resolved.id)) {
    return null;
  }
  return resolved.id;
}
