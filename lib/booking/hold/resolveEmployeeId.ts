import { ANY_EMPLOYEE_ID, type BookingEntity, type BookingSlot } from '@/lib/booking/constants';

export function resolveHoldEmployeeId(
  slot: Pick<BookingSlot, 'employeeId'>,
  employee: BookingEntity | null | undefined,
  profileEmployee: BookingEntity | null | undefined
): string | null {
  const fromSlot = slot.employeeId?.trim();
  if (fromSlot && fromSlot !== ANY_EMPLOYEE_ID && fromSlot !== 'any') {
    return fromSlot;
  }

  const resolved = profileEmployee ?? employee;
  if (!resolved?.id || resolved.id === ANY_EMPLOYEE_ID || resolved.id === 'any') {
    return null;
  }
  return resolved.id;
}
