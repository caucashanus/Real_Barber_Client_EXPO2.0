import type { BookingRecipeId, BookingPreset } from '@/lib/booking/engine/types';

export type BookingRouteParams = {
  recipe?: string;
  branchId?: string;
  employeeId?: string;
  itemId?: string;
  itemName?: string;
  employeeSlug?: string;
  serviceSlug?: string;
  branchSlug?: string;
  date?: string;
  slotStart?: string;
};

function trimParam(value: string | string[] | undefined | null): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolvePresetFromRouteParams(
  params: Record<string, string | string[] | undefined | null>
): { recipeId: BookingRecipeId; preset: BookingPreset } {
  const recipeParam = trimParam(params.recipe) as BookingRecipeId | undefined;
  const branchId = trimParam(params.branchId);
  const employeeId = trimParam(params.employeeId);
  const serviceId = trimParam(params.itemId);
  const branchSlug = trimParam(params.branchSlug);
  const employeeSlug = trimParam(params.employeeSlug);
  const serviceSlug = trimParam(params.serviceSlug);

  if (recipeParam === 'employee-profile' || (employeeId && !serviceId && !branchId)) {
    return {
      recipeId: 'employee-profile',
      preset: {
        recipeId: 'employee-profile',
        employeeId,
        employeeSlug,
      },
    };
  }

  if (recipeParam === 'service-detail' || (serviceId && !branchId && !employeeId)) {
    return {
      recipeId: 'service-detail',
      preset: {
        recipeId: 'service-detail',
        serviceId,
        serviceSlug,
      },
    };
  }

  return {
    recipeId: 'branch-first',
    preset: {
      recipeId: 'branch-first',
      branchId,
      branchSlug,
      employeeId,
      employeeSlug,
      serviceId,
      serviceSlug,
    },
  };
}

export function buildBookingEngineHref(params: {
  recipe?: BookingRecipeId;
  branchId?: string;
  employeeId?: string;
  itemId?: string;
  itemName?: string;
}): string {
  const q = new URLSearchParams();
  if (params.recipe) q.set('recipe', params.recipe);
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.employeeId) q.set('employeeId', params.employeeId);
  if (params.itemId) q.set('itemId', params.itemId);
  if (params.itemName) q.set('itemName', params.itemName);
  const query = q.toString();
  return query ? `/screens/reservation-create?${query}` : '/screens/reservation-create';
}
