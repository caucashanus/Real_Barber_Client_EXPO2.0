import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function saveReservationSlotHandoff(
  handoff: Omit<ReservationSlotHandoff, 'savedAt'>
): Promise<void> {
  const payload: StoredHandoffPayload = {
    handoff: { ...handoff, savedAt: Date.now() },
    expiresAt: Date.now() + HANDOFF_TTL_MS,
  };
  await AsyncStorage.setItem(RESERVATION_SLOT_HANDOFF_KEY, JSON.stringify(payload)).catch(
    () => {}
  );
}

export async function readReservationSlotHandoff(): Promise<ReservationSlotHandoff | null> {
  const raw = await AsyncStorage.getItem(RESERVATION_SLOT_HANDOFF_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredHandoffPayload;
    if (!parsed?.handoff || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() >= parsed.expiresAt) {
      await clearReservationSlotHandoff();
      return null;
    }
    return parsed.handoff;
  } catch {
    await clearReservationSlotHandoff();
    return null;
  }
}

export async function clearReservationSlotHandoff(): Promise<void> {
  await AsyncStorage.removeItem(RESERVATION_SLOT_HANDOFF_KEY).catch(() => {});
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

/** Profil holiče → klik na slot → handoff + booking (jen employeeId v URL). */
export async function startBarberSlotHandoffBooking(
  params: StartBarberSlotHandoffBookingParams
): Promise<void> {
  const { router } = await import('expo-router');
  await saveReservationSlotHandoff(params);
  router.push(
    `/screens/reservation-create?employeeId=${encodeURIComponent(params.employeeId)}` as never
  );
}
