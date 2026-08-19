export type BookingStepKind =
  | 'branch'
  | 'service'
  | 'employee'
  | 'datetime'
  | 'contact'
  | 'summary';

export const BOOKING_TERMINAL_STEPS = [
  'datetime',
  'contact',
  'summary',
] as const satisfies readonly BookingStepKind[];

export type BookingRecipeId = 'branch-first' | 'employee-profile' | 'service-detail';

export type BookingPickerStyle = 'classic' | 'modern';

export type BookingPreset = {
  recipeId: BookingRecipeId;
  branchSlug?: string;
  serviceSlug?: string;
  employeeSlug?: string;
  branchId?: string;
  serviceId?: string;
  employeeId?: string;
};

export type BookingHandoffPreset = {
  branchId?: string;
  serviceId?: string;
  employeeId?: string;
  employeeSlug?: string;
};

export type BookingBootstrap = {
  branchCount?: number;
  employeeBranchCount?: number;
  employeeProfileMultiBranch?: boolean;
  skipContact?: boolean;
  skipDatetime?: boolean;
  handoffPreset?: BookingHandoffPreset;
};

export type BookingRecipe = {
  id: BookingRecipeId;
  baseStepOrder: BookingStepKind[];
  ui: { pickerStyle: BookingPickerStyle };
};

export type BookingSelections = {
  branch: { id: string; name?: string } | null;
  service: { id: string; name?: string } | null;
  employee: { id: string; name?: string } | null;
  date: string | null;
  slot: { start: string; end: string; branchId?: string } | null;
};

export const EMPTY_SELECTIONS: BookingSelections = {
  branch: null,
  service: null,
  employee: null,
  date: null,
  slot: null,
};
