import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  legacyHandoffToEngine,
  saveBookingSlotHandoff,
} from '@/lib/booking/engine/navigation/slotHandoff';

export const RESERVATION_SLOT_HANDOFF_KEY = '@rezervace-slot-handoff';
const HANDOFF_TTL_MS = 2 * 60 * 60 * 1000;

export interface ReservationSlotHandoff {
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  branchAddress?: string | null;
  date: string;
  slotStart: string;
  slotEnd?: string;
  savedAt: number;
}

interface StoredHandoffPayload {
  handoff: ReservationSlotHandoff;
  expiresAt: number;
}

/** @deprecated Use engine handoff directly — kept for call-site compatibility. */
export async function saveReservationSlotHandoff(
  handoff: Omit<ReservationSlotHandoff, 'savedAt'>
): Promise<void> {
  await saveBookingSlotHandoff(
    legacyHandoffToEngine({
      employeeId: handoff.employeeId,
      employeeName: handoff.employeeName,
      branchId: handoff.branchId,
      branchName: handoff.branchName,
      branchAddress: handoff.branchAddress,
      date: handoff.date,
      slotStart: handoff.slotStart,
      slotEnd: handoff.slotEnd,
    })
  );
}

export async function readReservationSlotHandoff(): Promise<ReservationSlotHandoff | null> {
  const { readBookingSlotHandoff } = await import('@/lib/booking/engine/navigation/slotHandoff');
  const handoff = await readBookingSlotHandoff();
  if (!handoff) return null;
  return {
    employeeId: handoff.employeeId,
    employeeName: handoff.employeeName ?? '',
    branchId: handoff.branchId,
    branchName: handoff.branchName ?? '',
    branchAddress: handoff.branchAddress ?? null,
    date: handoff.date,
    slotStart: handoff.slot.start,
    slotEnd: handoff.slot.end,
    savedAt: handoff.createdAt ?? Date.now(),
  };
}

export async function clearReservationSlotHandoff(): Promise<void> {
  const { clearBookingSlotHandoff } = await import('@/lib/booking/engine/navigation/slotHandoff');
  await clearBookingSlotHandoff();
}

export interface StartBarberSlotHandoffBookingParams {
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  branchAddress?: string | null;
  date: string;
  slotStart: string;
  slotEnd?: string;
}

/** Profil holiče → klik na slot → handoff + booking (employee-profile recept). */
export async function startBarberSlotHandoffBooking(
  params: StartBarberSlotHandoffBookingParams
): Promise<void> {
  const { router } = await import('expo-router');
  await saveReservationSlotHandoff(params);
  router.push(
    `/screens/reservation-create?recipe=employee-profile&employeeId=${encodeURIComponent(params.employeeId)}` as never
  );
}

/** Legacy storage cleanup helper — engine uses same key now. */
export async function migrateLegacyHandoffStorage(): Promise<void> {
  const raw = await AsyncStorage.getItem(RESERVATION_SLOT_HANDOFF_KEY).catch(() => null);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as StoredHandoffPayload;
    if (parsed?.handoff && typeof parsed.expiresAt === 'number' && Date.now() < parsed.expiresAt) {
      await saveReservationSlotHandoff(parsed.handoff);
    }
  } catch {
    // ignore
  }
}
