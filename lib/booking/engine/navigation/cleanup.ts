import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BookingEntity, BookingService, BookingSlot } from '@/lib/booking/constants';
import type { BookingSelections, BookingStepKind } from '@/lib/booking/engine/types';

export const BOOKING_SLOT_STORAGE_KEY = '@rezervace-selected-slot';

export type StoredBookingSlotServiceMeta = {
  serviceName?: string;
  servicePrice?: number;
  serviceDurationMinutes?: number;
  serviceImageUrl?: string;
  branchAddress?: string;
};

export type StoredBookingSlotContext = StoredBookingSlotServiceMeta & {
  branchId: string;
  serviceId: string;
  employeeId: string;
  date: string;
  slot: BookingSlot;
};

export async function saveBookingSlotContext(context: StoredBookingSlotContext): Promise<void> {
  await AsyncStorage.setItem(BOOKING_SLOT_STORAGE_KEY, JSON.stringify(context)).catch(() => {});
}

export async function readBookingSlotContext(): Promise<StoredBookingSlotContext | null> {
  const raw = await AsyncStorage.getItem(BOOKING_SLOT_STORAGE_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredBookingSlotContext;
    if (
      !parsed?.branchId ||
      !parsed?.serviceId ||
      !parsed?.employeeId ||
      !parsed?.date ||
      !parsed?.slot?.start
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearBookingSlotContext(): Promise<void> {
  await AsyncStorage.removeItem(BOOKING_SLOT_STORAGE_KEY).catch(() => {});
}

export type BookingSlotRestoreCatalogs = {
  branches: BookingEntity[];
  profileBranches: { id: string; name?: string; address?: string }[];
};

function branchHasDisplayName(entity: BookingEntity): boolean {
  const name = entity.name?.trim();
  return Boolean(name && name !== entity.id);
}

export function enrichServiceFromStoredSlotContext(
  service: BookingService,
  stored: StoredBookingSlotContext
): BookingService {
  if (stored.serviceId !== service.id) return service;
  const price =
    stored.servicePrice != null && stored.servicePrice > 0 ? stored.servicePrice : undefined;
  const duration =
    stored.serviceDurationMinutes != null && stored.serviceDurationMinutes > 0
      ? stored.serviceDurationMinutes
      : undefined;
  const imageUrl = stored.serviceImageUrl?.trim() || undefined;
  return {
    ...service,
    name: stored.serviceName?.trim() || service.name,
    ...(price != null ? { pricing: { minPrice: price, maxPrice: price } } : {}),
    ...(duration != null ? { duration } : {}),
    ...(imageUrl ? { imageUrl, avatarUrl: imageUrl } : {}),
  };
}

export function bookingServiceFromStoredSlotContext(
  stored: StoredBookingSlotContext
): BookingService {
  const price =
    stored.servicePrice != null && stored.servicePrice > 0 ? stored.servicePrice : undefined;
  const duration =
    stored.serviceDurationMinutes != null && stored.serviceDurationMinutes > 0
      ? stored.serviceDurationMinutes
      : undefined;
  const imageUrl = stored.serviceImageUrl?.trim() || undefined;
  return {
    id: stored.serviceId,
    name: stored.serviceName?.trim() || stored.serviceId,
    ...(price != null ? { pricing: { minPrice: price, maxPrice: price } } : {}),
    ...(duration != null ? { duration } : {}),
    ...(imageUrl ? { imageUrl, avatarUrl: imageUrl } : {}),
  };
}

export function resolveBranchEntityForSlotRestore(
  storedBranchId: string,
  selectedBranch: BookingEntity | null | undefined,
  catalogs: BookingSlotRestoreCatalogs,
  slotBranchName?: string | null,
  storedBranchAddress?: string | null
): BookingEntity {
  if (selectedBranch?.id === storedBranchId) {
    return enrichBranchDisplayName(
      selectedBranch,
      storedBranchId,
      catalogs,
      slotBranchName,
      storedBranchAddress
    );
  }
  const fromCatalog = catalogs.branches.find((b) => b.id === storedBranchId);
  if (fromCatalog) {
    return enrichBranchDisplayName(
      fromCatalog,
      storedBranchId,
      catalogs,
      slotBranchName,
      storedBranchAddress
    );
  }
  const fromProfile = catalogs.profileBranches.find((b) => b.id === storedBranchId);
  if (fromProfile) {
    return enrichBranchDisplayName(
      { id: fromProfile.id, name: fromProfile.name, address: fromProfile.address },
      storedBranchId,
      catalogs,
      slotBranchName,
      storedBranchAddress
    );
  }
  const name = slotBranchName?.trim() || '';
  const address = storedBranchAddress?.trim() || '';
  return {
    id: storedBranchId,
    ...(name ? { name } : {}),
    ...(address ? { address } : {}),
  };
}

function enrichBranchDisplayName(
  entity: BookingEntity,
  branchId: string,
  catalogs: BookingSlotRestoreCatalogs,
  slotBranchName?: string | null,
  storedBranchAddress?: string | null
): BookingEntity {
  let next = entity;
  if (!branchHasDisplayName(next)) {
    const betterName =
      slotBranchName?.trim() ||
      catalogs.profileBranches.find((b) => b.id === branchId)?.name?.trim() ||
      catalogs.branches.find((b) => b.id === branchId)?.name?.trim();
    if (betterName && betterName !== branchId) {
      next = { ...next, name: betterName };
    }
  }
  const address = storedBranchAddress?.trim();
  if (address && !next.address?.trim()) {
    next = { ...next, address };
  }
  return next;
}

export function storedSlotMatchesFlowIds(
  stored: StoredBookingSlotContext,
  flowIds: {
    branchId?: string | null;
    serviceId?: string | null;
    employeeId?: string | null;
  }
): boolean {
  const branchId = flowIds.branchId ?? stored.branchId;
  const serviceId = flowIds.serviceId ?? stored.serviceId;
  const employeeId = flowIds.employeeId ?? stored.employeeId;
  return (
    branchId === stored.branchId &&
    serviceId === stored.serviceId &&
    employeeId === stored.employeeId
  );
}

type SelectionSetters = {
  setSlot: (slot: BookingSelections['slot']) => void;
  setDate: (date: string | null) => void;
  setEmployee: (employee: BookingSelections['employee']) => void;
  setService: (service: BookingSelections['service']) => void;
  setBranch: (branch: BookingSelections['branch']) => void;
};

export function applyBookingBackwardCleanup(
  fromStep: BookingStepKind,
  toStep: BookingStepKind,
  activeSteps: readonly BookingStepKind[],
  setters: SelectionSetters,
  options?: { clearContactOtp?: () => void; awaitingOtp?: boolean }
): void {
  const fromIdx = activeSteps.indexOf(fromStep);
  const toIdx = activeSteps.indexOf(toStep);
  if (fromIdx === -1 || toIdx === -1 || toIdx >= fromIdx) return;

  const shouldClear = (kind: BookingStepKind) => {
    const idx = activeSteps.indexOf(kind);
    return idx !== -1 && fromIdx >= idx && toIdx < idx;
  };

  if (options?.awaitingOtp && (shouldClear('contact') || shouldClear('datetime'))) {
    options.clearContactOtp?.();
  }

  if (shouldClear('contact') || shouldClear('datetime')) {
    setters.setSlot(null);
  }

  if (shouldClear('datetime') || (fromStep === 'contact' && toStep === 'datetime')) {
    setters.setDate(null);
  }

  if (shouldClear('employee')) setters.setEmployee(null);
  if (shouldClear('service')) setters.setService(null);
  if (shouldClear('branch')) setters.setBranch(null);
}

export function computeMaxAllowedStep(
  activeSteps: readonly BookingStepKind[],
  selections: BookingSelections
): BookingStepKind {
  for (let i = 0; i < activeSteps.length; i++) {
    const kind = activeSteps[i]!;
    if (!isStepSatisfied(kind, selections)) {
      return kind;
    }
  }
  return activeSteps[activeSteps.length - 1] ?? activeSteps[0] ?? 'branch';
}

function isStepSatisfied(kind: BookingStepKind, selections: BookingSelections): boolean {
  if (kind === 'branch') return !!selections.branch;
  if (kind === 'service') return !!selections.service;
  if (kind === 'employee') return !!selections.employee;
  if (kind === 'datetime') return !!selections.slot;
  if (kind === 'contact') return true;
  return true;
}

export function isStepSatisfiedForKind(
  kind: BookingStepKind,
  selections: BookingSelections
): boolean {
  return isStepSatisfied(kind, selections);
}
