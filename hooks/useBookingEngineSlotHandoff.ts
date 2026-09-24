import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { getBookingSlotServices } from '@/api/bookingEngine';
import type { BookingEntity, BookingService } from '@/lib/booking/constants';
import type { BookingSlotServiceItem } from '@/lib/booking/booking-api/types';
import { resolveBranchEntityForSlotRestore } from '@/lib/booking/engine/navigation/cleanup';
import {
  readBookingSlotHandoff,
  type StoredBookingSlotHandoff,
} from '@/lib/booking/engine/navigation/slotHandoff';
import type { BookingRecipeId, BookingStepKind } from '@/lib/booking/engine/types';
import { invalidateListingAvailability } from '@/lib/availability/listingCache';
import type { TranslationKey } from '@/locales';

export function useBookingEngineSlotHandoffState() {
  const [slotHandoff, setSlotHandoff] = useState<StoredBookingSlotHandoff | null>(null);
  const [fromSlotHandoff, setFromSlotHandoff] = useState(false);
  return { slotHandoff, setSlotHandoff, fromSlotHandoff, setFromSlotHandoff };
}

export function useBookingEngineSlotHandoffEffects(params: {
  recipeId: BookingRecipeId;
  preset: { employeeId?: string; serviceId?: string };
  step: BookingStepKind;
  branches: BookingEntity[];
  profileBranches: { id: string; name?: string; address?: string }[];
  patchSelections: (
    patch: (state: {
      branch: BookingEntity | null;
      service: BookingService | null;
      employee: BookingEntity | null;
      date: string | null;
      slot: import('@/lib/booking/constants').BookingSlot | null;
    }) => Partial<{
      branch: BookingEntity | null;
      service: BookingService | null;
      employee: BookingEntity | null;
      date: string | null;
      slot: import('@/lib/booking/constants').BookingSlot | null;
    }>
  ) => void;
  locale: string;
  apiToken: string | null;
  t: (key: TranslationKey) => string;
  slotHandoff: StoredBookingSlotHandoff | null;
  setSlotHandoff: Dispatch<SetStateAction<StoredBookingSlotHandoff | null>>;
  setFromSlotHandoff: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    recipeId,
    preset,
    step,
    branches,
    profileBranches,
    patchSelections,
    locale,
    apiToken,
    t,
    slotHandoff,
    setSlotHandoff,
    setFromSlotHandoff,
  } = params;

  const [slotServices, setSlotServices] = useState<BookingSlotServiceItem[]>([]);
  const [loadingSlotServices, setLoadingSlotServices] = useState(false);
  const [slotServicesError, setSlotServicesError] = useState<string | null>(null);
  const slotGoneInvalidatedRef = useRef(false);
  const handoffAppliedRef = useRef(false);

  useEffect(() => {
    if (recipeId !== 'employee-profile') return;

    let cancelled = false;
    void readBookingSlotHandoff().then((handoff) => {
      if (cancelled || !handoff || handoff.employeeId !== preset.employeeId) return;

      setSlotHandoff(handoff);
      setFromSlotHandoff(true);
      patchSelections((current) => {
        const resolved = resolveBranchEntityForSlotRestore(
          handoff.branchId,
          current.branch,
          { branches, profileBranches },
          handoff.slot.branchName ?? handoff.branchName,
          handoff.branchAddress
        );
        const branch =
          current.branch?.id === resolved.id && current.branch?.name === resolved.name
            ? current.branch
            : resolved;
        const slot =
          current.slot?.start === handoff.slot.start && current.slot?.end === handoff.slot.end
            ? current.slot
            : handoff.slot;
        return { branch, date: handoff.date, slot };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    recipeId,
    preset.employeeId,
    branches,
    profileBranches,
    patchSelections,
    setSlotHandoff,
    setFromSlotHandoff,
  ]);

  useEffect(() => {
    if (recipeId !== 'service-detail' || !preset.serviceId) return;

    let cancelled = false;
    void readBookingSlotHandoff().then((handoff) => {
      if (cancelled || !handoff?.serviceId || handoff.serviceId !== preset.serviceId) return;

      setSlotHandoff(handoff);
      setFromSlotHandoff(true);
      patchSelections((current) => ({
        branch: resolveBranchEntityForSlotRestore(
          handoff.branchId,
          current.branch,
          { branches, profileBranches },
          handoff.slot.branchName ?? handoff.branchName,
          handoff.branchAddress
        ),
        employee:
          current.employee?.id === handoff.employeeId
            ? current.employee
            : { id: handoff.employeeId, name: handoff.employeeName },
        date: handoff.date,
        slot: handoff.slot,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [
    recipeId,
    preset.serviceId,
    branches,
    profileBranches,
    patchSelections,
    setSlotHandoff,
    setFromSlotHandoff,
  ]);

  useEffect(() => {
    if (recipeId !== 'employee-profile' || step !== 'service' || !slotHandoff) {
      setSlotServices([]);
      return;
    }
    let cancelled = false;
    setLoadingSlotServices(true);
    setSlotServicesError(null);
    getBookingSlotServices(
      {
        employeeId: slotHandoff.employeeId,
        branchId: slotHandoff.branchId,
        date: slotHandoff.date,
        slotStart: slotHandoff.slot.start,
        slotEnd: slotHandoff.slot.end,
        locale,
      },
      apiToken
    )
      .then((data) => {
        if (!cancelled) setSlotServices(data.services ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setSlotServicesError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlotServices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId, step, slotHandoff, locale, apiToken, t]);

  const showSlotHandoffSlotGoneBanner = useMemo(
    () =>
      !loadingSlotServices &&
      !slotServicesError &&
      slotServices.length > 0 &&
      !slotServices.some((service) => service.available === true),
    [loadingSlotServices, slotServicesError, slotServices]
  );

  useEffect(() => {
    slotGoneInvalidatedRef.current = false;
  }, [
    slotHandoff?.employeeId,
    slotHandoff?.branchId,
    slotHandoff?.date,
    slotHandoff?.slot?.start,
  ]);

  useEffect(() => {
    if (!showSlotHandoffSlotGoneBanner || !slotHandoff || slotGoneInvalidatedRef.current) return;

    slotGoneInvalidatedRef.current = true;
    invalidateListingAvailability({
      employeeId: slotHandoff.employeeId,
      branchId: slotHandoff.branchId,
    });
  }, [showSlotHandoffSlotGoneBanner, slotHandoff]);

  return {
    slotServices,
    loadingSlotServices,
    slotServicesError,
    showSlotHandoffSlotGoneBanner,
    handoffAppliedRef,
  };
}
