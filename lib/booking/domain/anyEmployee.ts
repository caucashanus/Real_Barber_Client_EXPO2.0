import { ANY_EMPLOYEE_ID } from '@/lib/booking/constants';

export function isAnyEmployeeId(employeeId: string | null | undefined): boolean {
  const id = employeeId?.trim().toLowerCase();
  return id === ANY_EMPLOYEE_ID || id === 'any';
}
