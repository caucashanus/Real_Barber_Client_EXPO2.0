import type { BookingRecipeId } from '@/lib/booking/engine/types';
import type { BookingMonitorEntry } from '@/lib/booking/monitor/types';

export function resolveBookingMonitorEntry(params: {
  recipeId: BookingRecipeId | string;
  nearestSlotHandoff?: boolean;
  from?: string | null;
  branchId?: string | null;
  employeeId?: string | null;
  serviceId?: string | null;
}): BookingMonitorEntry {
  if (params.nearestSlotHandoff) return 'nearest-slot';

  const from = params.from?.trim().toLowerCase();
  if (from === 'nearest-slot') return 'nearest-slot';
  if (from === 'repeat') return 'repeat';
  if (from === 'spotlight') return 'spotlight';
  if (from === 'deep-link') return 'deep-link';

  const hasRepeatPreset = Boolean(
    params.branchId?.trim() &&
      params.employeeId?.trim() &&
      params.serviceId?.trim()
  );
  if (hasRepeatPreset) return 'repeat';

  const recipe = params.recipeId?.trim();
  if (recipe === 'branch-first' || recipe === 'employee-profile' || recipe === 'service-detail') {
    return recipe;
  }

  return 'unknown';
}
