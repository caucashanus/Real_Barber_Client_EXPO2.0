import type { BookingEntity, BookingService, BookingSlot } from '@/lib/booking/constants';
import type { BookingRecipeId, BookingStepKind } from '@/lib/booking/engine/types';
import type { TrackBookingMonitorFields } from '@/lib/booking/monitor/types';

export function bookingMonitorFieldsFromSelections(params: {
  recipeId: BookingRecipeId | string;
  step: BookingStepKind;
  locale: string;
  selectedBranch?: BookingEntity | null;
  selectedService?: BookingService | null;
  selectedEmployee?: BookingEntity | null;
  profileEmployee?: BookingEntity | null;
  selectedDate?: string | null;
  selectedSlot?: BookingSlot | null;
  isNewClient?: boolean | null;
}): TrackBookingMonitorFields {
  const employee = params.selectedEmployee ?? params.profileEmployee;
  return {
    recipeId: params.recipeId,
    step: params.step,
    locale: params.locale,
    branchName: params.selectedBranch?.name ?? params.selectedBranch?.displayName ?? null,
    serviceName: params.selectedService?.name ?? null,
    employeeName: employee?.name ?? employee?.displayName ?? null,
    date: params.selectedDate ?? undefined,
    slotStart: params.selectedSlot?.start,
    slotEnd: params.selectedSlot?.end,
    isNewClient: params.isNewClient ?? undefined,
  };
}
