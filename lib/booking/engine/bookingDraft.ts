import AsyncStorage from '@react-native-async-storage/async-storage';

export const BOOKING_DRAFT_STORAGE_KEY = 'rb.booking.draft';

/** Clears legacy draft storage (draft persistence is not used by the booking engine). */
export async function clearBookingDraft(): Promise<void> {
  await AsyncStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY).catch(() => {});
}
