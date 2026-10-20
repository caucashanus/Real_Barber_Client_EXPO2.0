export type VisitPlanBookingLocks = {
  service: boolean;
  branch: boolean;
  employee: boolean;
};

export const DEFAULT_VISIT_PLAN_BOOKING_LOCKS: VisitPlanBookingLocks = {
  service: true,
  branch: true,
  employee: false,
};

export function applyVisitPlanLockChange(
  prev: VisitPlanBookingLocks,
  key: keyof VisitPlanBookingLocks,
  value: boolean
): VisitPlanBookingLocks {
  if (key === 'employee' && value) {
    return { ...prev, employee: true, branch: true };
  }
  if (key === 'branch' && !value) {
    return { ...prev, branch: false, employee: false };
  }
  return { ...prev, [key]: value };
}

export function normalizeVisitPlanBookingLocks(locks: VisitPlanBookingLocks): VisitPlanBookingLocks {
  if (!locks.branch && locks.employee) {
    return { ...locks, branch: true };
  }
  if (!locks.branch) {
    return { ...locks, employee: false };
  }
  return locks;
}
