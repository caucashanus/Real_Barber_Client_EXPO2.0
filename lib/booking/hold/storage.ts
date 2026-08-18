import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BookingHoldState } from '@/lib/booking/hold/types';

const BOOKING_HOLD_STORAGE_KEY = '@rb-booking-hold';

export async function readBookingHoldStorage(): Promise<BookingHoldState | null> {
  try {
    const raw = await AsyncStorage.getItem(BOOKING_HOLD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BookingHoldState>;
    if (
      !parsed.holdId ||
      !parsed.expiresAt ||
      !parsed.branchId ||
      !parsed.itemId ||
      !parsed.employeeId ||
      !parsed.date ||
      !parsed.slotStart ||
      !parsed.slotEnd
    ) {
      return null;
    }
    const expiresAtMs = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      await AsyncStorage.removeItem(BOOKING_HOLD_STORAGE_KEY);
      return null;
    }
    return parsed as BookingHoldState;
  } catch {
    return null;
  }
}

export async function writeBookingHoldStorage(state: BookingHoldState): Promise<void> {
  await AsyncStorage.setItem(BOOKING_HOLD_STORAGE_KEY, JSON.stringify(state));
}

export async function clearBookingHoldStorage(): Promise<void> {
  await AsyncStorage.removeItem(BOOKING_HOLD_STORAGE_KEY);
}
