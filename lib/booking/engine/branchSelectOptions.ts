import type { BookingRecipeId } from '@/lib/booking/engine/types';

export type BranchSetOptions = {
  clearDownstream?: boolean;
  preserveService?: boolean;
};

/** Options when the user picks a branch in the booking wizard (clears downstream by default). */
export function optionsForUserBranchSelect(recipeId: BookingRecipeId): BranchSetOptions {
  if (recipeId === 'service-detail') {
    return { preserveService: true };
  }
  return {};
}
