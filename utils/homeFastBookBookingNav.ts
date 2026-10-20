import { router } from 'expo-router';

import type { HomeFastBookService } from '@/constants/homeFastBookServices';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';
import { startHairstyleSlotHandoffBooking } from '@/utils/hairstyleSlotHandoff';

export function nearestBranchHomeSlotSelectionKey(slot: NearestBranchHomeSlot): string {
  return `${slot.branchId}-${slot.employeeId}-${slot.date}-${slot.time}`;
}

export async function prepareNearestBranchHomeSlotBooking(
  slot: NearestBranchHomeSlot,
  service: { serviceId: string; serviceName: string }
): Promise<void> {
  await startHairstyleSlotHandoffBooking({
    slot,
    serviceId: service.serviceId,
    serviceName: service.serviceName,
  });
}

export function navigateHomeFastBookLater(selectedService?: HomeFastBookService | null): void {
  if (selectedService) {
    router.push(
      `/screens/reservation-create?recipe=service-detail&itemId=${encodeURIComponent(selectedService.crmId)}&serviceSlug=${encodeURIComponent(selectedService.identitySlug)}` as never
    );
    return;
  }
  router.push('/screens/reservation-create?recipe=branch-first' as never);
}
