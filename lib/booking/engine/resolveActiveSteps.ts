import type { BookingBootstrap, BookingPreset, BookingRecipe, BookingStepKind } from '@/lib/booking/engine/types';

export function shouldSkipStep(
  step: BookingStepKind,
  preset: BookingPreset,
  bootstrap: BookingBootstrap,
  _recipe: BookingRecipe
): boolean {
  if (step === 'contact') {
    return bootstrap.skipContact === true;
  }

  if (step === 'summary') {
    return bootstrap.skipContact !== true;
  }

  const handoff = bootstrap.handoffPreset;

  if (step === 'branch') {
    if (preset.branchSlug || preset.branchId) return true;
    if (handoff?.branchId) return true;
    if (preset.recipeId === 'employee-profile') return true;
    if (preset.employeeId && bootstrap.employeeBranchCount === 1) return true;
    return false;
  }

  if (step === 'service') {
    if (preset.serviceSlug || preset.serviceId) return true;
    if (handoff?.serviceId) return true;
    return false;
  }

  if (step === 'employee') {
    if (preset.employeeSlug || preset.employeeId) return true;
    if (handoff?.employeeId) return true;
    if (preset.recipeId === 'employee-profile') return true;
    return false;
  }

  if (step === 'datetime') {
    return bootstrap.skipDatetime === true;
  }

  return false;
}

export function resolveActiveSteps(
  recipe: BookingRecipe,
  preset: BookingPreset,
  bootstrap: BookingBootstrap = {}
): BookingStepKind[] {
  return recipe.baseStepOrder.filter(
    (step) => !shouldSkipStep(step, preset, bootstrap, recipe)
  );
}

export function usesMultiBranchDatetimeLegend(
  preset: BookingPreset,
  bootstrap: BookingBootstrap
): boolean {
  return preset.recipeId === 'employee-profile' && bootstrap.employeeProfileMultiBranch === true;
}
