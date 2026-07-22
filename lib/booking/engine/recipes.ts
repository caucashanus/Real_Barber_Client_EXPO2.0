import type { BookingRecipe, BookingRecipeId, BookingStepKind } from '@/lib/booking/engine/types';
import { BOOKING_TERMINAL_STEPS } from '@/lib/booking/engine/types';

function withTerminal(picker: BookingStepKind[]): BookingStepKind[] {
  return [...picker, ...BOOKING_TERMINAL_STEPS];
}

const BASE_ORDERS: Record<BookingRecipeId, BookingStepKind[]> = {
  'branch-first': withTerminal(['branch', 'service', 'employee']),
  'branch-first-classic': withTerminal(['branch', 'service', 'employee']),
  'employee-first': withTerminal(['employee', 'branch', 'service']),
  'hairstyle-first': withTerminal(['service', 'branch', 'employee']),
  'packages-first': withTerminal(['service', 'branch', 'employee']),
  'employee-profile': withTerminal(['service']),
  'service-detail': withTerminal(['branch', 'employee']),
};

export function getRecipe(id: BookingRecipeId): BookingRecipe {
  return {
    id,
    baseStepOrder: [...BASE_ORDERS[id]],
    ui: {
      pickerStyle: id === 'branch-first-classic' ? 'classic' : 'modern',
    },
  };
}

export function isCatalogRecipe(id: BookingRecipeId): boolean {
  return (
    id === 'branch-first' ||
    id === 'branch-first-classic' ||
    id === 'employee-first' ||
    id === 'hairstyle-first' ||
    id === 'packages-first'
  );
}
