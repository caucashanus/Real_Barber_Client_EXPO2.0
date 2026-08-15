import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BookingSlot } from '@/lib/booking/constants';
import type { BookingRecipeId } from '@/lib/booking/engine/types';
import type { BookingSelectionsState } from '@/lib/booking/engine/bookingSelectionsReducer';

export const BOOKING_DRAFT_STORAGE_KEY = 'rb.booking.draft';
export const BOOKING_DRAFT_VERSION = 1;
export const BOOKING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export type BookingDraftSnapshot = {
  v: number;
  recipeId: BookingRecipeId;
  branch: { id: string; name?: string; address?: string } | null;
  service: {
    id: string;
    name?: string;
    servicePrice?: number;
    serviceDurationMinutes?: number;
    serviceImageUrl?: string;
  } | null;
  employee: { id: string; name?: string } | null;
  date: string | null;
  slot: BookingSlot | null;
  stepIndex: number;
  savedAt: number;
};

function isFresh(savedAt: number, nowMs = Date.now()): boolean {
  return nowMs - savedAt <= BOOKING_DRAFT_TTL_MS;
}

export function buildBookingDraftSnapshot(
  recipeId: BookingRecipeId,
  selections: BookingSelectionsState,
  stepIndex: number,
  savedAt = Date.now()
): BookingDraftSnapshot {
  return {
    v: BOOKING_DRAFT_VERSION,
    recipeId,
    branch: selections.branch
      ? {
          id: selections.branch.id,
          name: selections.branch.name ?? selections.branch.displayName,
          address: selections.branch.address,
        }
      : null,
    service: selections.service
      ? {
          id: selections.service.id,
          name: selections.service.name,
          servicePrice: selections.service.pricing?.minPrice,
          serviceDurationMinutes: selections.service.duration,
          serviceImageUrl: selections.service.imageUrl ?? selections.service.avatarUrl ?? undefined,
        }
      : null,
    employee: selections.employee
      ? {
          id: selections.employee.id,
          name: selections.employee.name ?? selections.employee.displayName,
        }
      : null,
    date: selections.date,
    slot: selections.slot,
    stepIndex,
    savedAt,
  };
}

export function restoreSelectionsFromDraft(
  draft: BookingDraftSnapshot
): Partial<BookingSelectionsState> & { stepIndex: number } {
  return {
    branch: draft.branch
      ? {
          id: draft.branch.id,
          name: draft.branch.name,
          address: draft.branch.address,
        }
      : null,
    service: draft.service
      ? {
          id: draft.service.id,
          name: draft.service.name,
          ...(draft.service.servicePrice != null
            ? {
                pricing: {
                  minPrice: draft.service.servicePrice,
                  maxPrice: draft.service.servicePrice,
                  kind: 'exact' as const,
                },
              }
            : {}),
          ...(draft.service.serviceDurationMinutes != null
            ? { duration: draft.service.serviceDurationMinutes }
            : {}),
          ...(draft.service.serviceImageUrl
            ? {
                imageUrl: draft.service.serviceImageUrl,
                avatarUrl: draft.service.serviceImageUrl,
              }
            : {}),
        }
      : null,
    employee: draft.employee
      ? {
          id: draft.employee.id,
          name: draft.employee.name,
        }
      : null,
    date: draft.date,
    slot: draft.slot,
    stepIndex: draft.stepIndex,
  };
}

export async function readBookingDraft(): Promise<BookingDraftSnapshot | null> {
  const raw = await AsyncStorage.getItem(BOOKING_DRAFT_STORAGE_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BookingDraftSnapshot;
    if (parsed.v !== BOOKING_DRAFT_VERSION) return null;
    if (!parsed.recipeId || !parsed.savedAt) return null;
    if (!isFresh(parsed.savedAt)) {
      await clearBookingDraft();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveBookingDraft(snapshot: BookingDraftSnapshot): Promise<void> {
  await AsyncStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
}

export async function clearBookingDraft(): Promise<void> {
  await AsyncStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY).catch(() => {});
}

export function shouldRestoreBookingDraft(params: {
  draft: BookingDraftSnapshot;
  recipeId: BookingRecipeId;
  presetBranchId?: string;
  presetServiceId?: string;
  presetEmployeeId?: string;
}): boolean {
  if (params.draft.recipeId !== params.recipeId) return false;
  if (params.presetBranchId && params.presetServiceId && params.presetEmployeeId) {
    return false;
  }
  if (params.presetBranchId || params.presetServiceId || params.presetEmployeeId) {
    return false;
  }
  return Boolean(
    params.draft.branch ||
      params.draft.service ||
      params.draft.employee ||
      params.draft.date ||
      params.draft.slot
  );
}
