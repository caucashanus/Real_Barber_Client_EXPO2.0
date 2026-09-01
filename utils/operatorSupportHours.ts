import { getOperatorOpenStatus } from '@/utils/operatorOpenStatus';

/** Po–Pá 8:30–21:30, So–Ne 9:30–18:30 (Europe/Prague). */
export function isOperatorSupportAvailable(date = new Date()): boolean {
  const status = getOperatorOpenStatus(date);
  return status === 'open' || status === 'closingSoon';
}
