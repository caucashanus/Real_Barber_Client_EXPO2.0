import type { Booking } from '@/api/bookings';
import { clearBookingDraft } from '@/lib/booking/engine/bookingDraft';
import type { BookingStepKind } from '@/lib/booking/engine/types';
import {
  normalizeVisitPlanBookingLocks,
  type VisitPlanBookingLocks,
} from '@/utils/visitPlanBookingLocks';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveVisitPlanBookingInitialStep(locks: VisitPlanBookingLocks): BookingStepKind {
  if (locks.service && locks.branch && locks.employee) return 'datetime';
  if (locks.service && locks.branch) return 'employee';
  if (locks.branch && !locks.service) return 'service';
  return 'branch';
}

export function buildVisitPlanBookingHref(
  booking: Booking,
  options: { date: string; locks: VisitPlanBookingLocks }
): string {
  const { date } = options;
  if (!ISO_DATE.test(date)) {
    throw new Error('buildVisitPlanBookingHref: invalid date');
  }

  const locks = normalizeVisitPlanBookingLocks(options.locks);
  const q = new URLSearchParams();
  q.set('recipe', 'branch-first');
  q.set('from', 'visit-plan');
  q.set('date', date);

  if (locks.branch && booking.branchId) q.set('branchId', booking.branchId);
  if (locks.service && booking.itemId) {
    q.set('itemId', booking.itemId);
    const itemName = booking.item?.name?.trim();
    if (itemName) q.set('itemName', itemName);
  }
  if (locks.employee && booking.employeeId) q.set('employeeId', booking.employeeId);

  q.set('step', resolveVisitPlanBookingInitialStep(locks));

  return `/screens/reservation-create?${q.toString()}`;
}

/** Klasický branch-first bez předvyplnění (větev bez minulé rezervace). */
export function buildVisitPlanClassicBookingHref(): string {
  const q = new URLSearchParams();
  q.set('recipe', 'branch-first');
  q.set('from', 'visit-plan');
  q.set('step', 'branch');
  return `/screens/reservation-create?${q.toString()}`;
}

export async function prepareVisitPlanClassicBookingNavigation(): Promise<string> {
  await clearBookingDraft();
  return buildVisitPlanClassicBookingHref();
}
