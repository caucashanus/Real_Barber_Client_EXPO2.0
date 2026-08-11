import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BookingSlot } from '@/lib/booking/constants';

export const BOOKING_SLOT_HANDOFF_KEY = '@rezervace-slot-handoff';
const HANDOFF_VERSION = 1;
const HANDOFF_TTL_MS = 2 * 60 * 60 * 1000;

export type StoredBookingSlotHandoff = {
  version?: number;
  createdAt?: number;
  serviceId?: string;
  serviceDurationMinutes?: number;
  employeeSlug?: string;
  employeeId: string;
  employeeName?: string;
  branchId: string;
  branchName?: string;
  branchAddress?: string;
  date: string;
  slot: BookingSlot;
};

function isValidHandoff(value: unknown): value is StoredBookingSlotHandoff {
  if (!value || typeof value !== 'object') return false;
  const parsed = value as StoredBookingSlotHandoff;
  return Boolean(parsed.employeeId && parsed.branchId && parsed.date && parsed.slot?.start);
}

function isExpired(handoff: StoredBookingSlotHandoff): boolean {
  if (typeof handoff.createdAt !== 'number') return false;
  return Date.now() - handoff.createdAt > HANDOFF_TTL_MS;
}

export async function saveBookingSlotHandoff(
  handoff: Omit<StoredBookingSlotHandoff, 'version' | 'createdAt'>
): Promise<void> {
  const payload: StoredBookingSlotHandoff = {
    ...handoff,
    version: HANDOFF_VERSION,
    createdAt: Date.now(),
  };
  await AsyncStorage.setItem(BOOKING_SLOT_HANDOFF_KEY, JSON.stringify(payload)).catch(() => {});
}

export async function readBookingSlotHandoff(): Promise<StoredBookingSlotHandoff | null> {
  const raw = await AsyncStorage.getItem(BOOKING_SLOT_HANDOFF_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidHandoff(parsed)) {
      await clearBookingSlotHandoff();
      return null;
    }
    if (isExpired(parsed)) {
      await clearBookingSlotHandoff();
      return null;
    }
    return parsed;
  } catch {
    await clearBookingSlotHandoff();
    return null;
  }
}

export async function clearBookingSlotHandoff(): Promise<void> {
  await AsyncStorage.removeItem(BOOKING_SLOT_HANDOFF_KEY).catch(() => {});
}

/** Converts legacy app handoff shape to engine shape. */
export function legacyHandoffToEngine(handoff: {
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  branchAddress?: string | null;
  date: string;
  slotStart: string;
  slotEnd?: string;
}): Omit<StoredBookingSlotHandoff, 'version' | 'createdAt'> {
  return {
    employeeId: handoff.employeeId,
    employeeName: handoff.employeeName,
    branchId: handoff.branchId,
    branchName: handoff.branchName,
    branchAddress: handoff.branchAddress ?? undefined,
    date: handoff.date,
    slot: {
      start: handoff.slotStart,
      end: handoff.slotEnd ?? handoff.slotStart,
      branchId: handoff.branchId,
      branchName: handoff.branchName,
    },
  };
}
