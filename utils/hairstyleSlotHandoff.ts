import { saveBookingSlotHandoff } from '@/lib/booking/engine/navigation/slotHandoff';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';

export interface StartHairstyleSlotHandoffBookingParams {
  serviceId: string;
  serviceName: string;
  slot: NearestBranchHomeSlot;
}

/** Detail účesu → chip nejbližšího termínu → service-detail booking s handoffem. */
export async function startHairstyleSlotHandoffBooking(
  params: StartHairstyleSlotHandoffBookingParams
): Promise<void> {
  const { router } = await import('expo-router');
  const { slot, serviceId, serviceName } = params;

  await saveBookingSlotHandoff({
    serviceId,
    employeeId: slot.employeeId,
    employeeName: slot.employeeName,
    branchId: slot.branchId,
    branchName: slot.branchName,
    branchAddress: slot.branchAddress ?? undefined,
    serviceDurationMinutes: slot.duration && slot.duration > 0 ? slot.duration : undefined,
    date: slot.date,
    slot: {
      start: slot.time,
      end: slot.endTime || slot.time,
      branchId: slot.branchId,
      branchName: slot.branchName,
    },
  });

  router.push(
    `/screens/reservation-create?recipe=service-detail&itemId=${encodeURIComponent(serviceId)}&itemName=${encodeURIComponent(serviceName)}&branchId=${encodeURIComponent(slot.branchId)}&employeeId=${encodeURIComponent(slot.employeeId)}` as never
  );
}
