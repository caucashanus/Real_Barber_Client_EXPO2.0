import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type BookingHoldCreateBody } from '@/api/bookingEngine';
import {
  useBookingEngineContext,
  useBookingEngineNavigation,
  useBookingEngineSelections,
} from '@/contexts/BookingEngineContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useThemeColors from '@/contexts/ThemeColors';
import {
  formatBookingSubmitError,
  useBookingReservationSubmit,
} from '@/hooks/useBookingReservationSubmit';
import { useBookingEngineCatalog } from '@/hooks/useBookingEngineCatalog';
import { useBookingEngineCoupon } from '@/hooks/useBookingEngineCoupon';
import { useBookingEngineDatetime } from '@/hooks/useBookingEngineDatetime';
import { useBookingEngineMonitor } from '@/hooks/useBookingEngineMonitor';
import {
  useBookingEngineSlotHandoffEffects,
  useBookingEngineSlotHandoffState,
} from '@/hooks/useBookingEngineSlotHandoff';
import { useBookingHold } from '@/hooks/useBookingHold';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/locales';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import {
  ANY_EMPLOYEE_ID,
  type BookingEntity,
  type BookingService,
  type BookingSlot,
} from '@/lib/booking/constants';
import {
  mapSlotServiceItemToBookingService,
} from '@/lib/booking/booking-api/mappers';
import type { BookingSlotServiceItem } from '@/lib/booking/booking-api/types';
import { resolveBranchName } from '@/lib/booking/designShared';
import { resolveBookingFlowFooterAction } from '@/lib/booking/bookingFlowFooter';
import { trimSearchParam } from '@/lib/booking/engine/flowParamUtils';
import { resolveHoldEmployeeId } from '@/lib/booking/hold/resolveEmployeeId';
import { isStoredHoldConsistentWithFlow } from '@/lib/booking/hold/reconcileHold';
import { getBookingSubmitBlockReason } from '@/lib/booking/submitReadiness';
import { resolveHoldSlotEnd } from '@/lib/booking/hold/slotEnd';
import {
  bookingServiceFromStoredSlotContext,
  clearBookingSlotContext,
  readBookingSlotContext,
  resolveBranchEntityForSlotRestore,
  saveBookingSlotContext,
} from '@/lib/booking/engine/navigation/cleanup';
import { clearBookingSlotHandoff } from '@/lib/booking/engine/navigation/slotHandoff';
import { getRecipe } from '@/lib/booking/engine/recipes';
import {
  resolveActiveSteps,
  usesMultiBranchDatetimeLegend,
} from '@/lib/booking/engine/resolveActiveSteps';
import type { BookingStepKind } from '@/lib/booking/engine/types';
import { bookingMonitorFieldsFromSelections } from '@/lib/booking/monitor/buildFields';
import {
  endBookingMonitorVisitQuietly,
  promoteBookingMonitorEntryNearestSlot,
  trackBookingMonitor,
} from '@/lib/booking/monitor/client';
import { setFreshBookingSnapshot } from '@/utils/freshBookingSnapshot';
import { invalidateListingAvailability } from '@/lib/availability/listingCache';
import { buildOptimisticBooking } from '@/utils/optimisticBooking';
import { setPendingCalendarPromo } from '@/utils/pendingCalendarPromo';
import { setPendingStoreReviewAfterBooking } from '@/utils/pendingStoreReview';
import {
  calendarTargetFromNearestSlot,
  normalizeBookingSlotStartForMatch,
} from '@/utils/reservationCreateHelpers';
import { intlLocaleTag } from '@/utils/intlLocaleTag';

function stepTitleKey(kind: BookingStepKind): TranslationKey {
  switch (kind) {
    case 'branch':
      return 'reservationStepBranchTitle';
    case 'service':
      return 'reservationStepServiceTitle';
    case 'employee':
      return 'reservationStepEmployeeTitle';
    case 'datetime':
      return 'reservationStepDatetimeTitle';
    case 'summary':
      return 'reservationSummaryTitle';
    default:
      return 'reservationStepBranchTitle';
  }
}

export function useBookingEngineFlow() {
  const params = useLocalSearchParams();
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { refresh: refreshBookings } = useBookings();
  const dateLocaleTag = intlLocaleTag(locale);
  const { recipeId, preset, clearDraft, resetSelections, setStepIndex } = useBookingEngineContext();
  const {
    selectedBranch,
    selectedService,
    selectedEmployee,
    selectedDate,
    selectedSlot,
    setBranch,
    setService,
    setEmployee,
    setDate,
    setSlot,
    patchSelections,
    toBookingSelections,
  } = useBookingEngineSelections();

  const routeMonitorFrom = trimSearchParam(params.from);
  const recipe = useMemo(() => getRecipe(recipeId), [recipeId]);

  const { slotHandoff, setSlotHandoff, fromSlotHandoff, setFromSlotHandoff } =
    useBookingEngineSlotHandoffState();

  const [bootstrapState, setBootstrapState] = useState<{
    employeeBranchCount?: number;
    employeeProfileMultiBranch?: boolean;
  }>({});

  const handoffPreset = useMemo(() => {
    if (!slotHandoff) return undefined;
    return {
      branchId: slotHandoff.branchId,
      serviceId: slotHandoff.serviceId,
      employeeId: slotHandoff.employeeId,
      employeeSlug: slotHandoff.employeeSlug,
    };
  }, [slotHandoff]);

  const flowBootstrap = useMemo(
    () => ({
      ...bootstrapState,
      skipDatetime: false,
      handoffPreset,
    }),
    [bootstrapState, handoffPreset]
  );

  const activeSteps = useMemo(
    () => resolveActiveSteps(recipe, preset, flowBootstrap),
    [recipe, preset, flowBootstrap]
  );

  const {
    stepIndex,
    step,
    goToStepIndex,
    goToStepByKind,
    isNextDisabled,
    onStepIndexChange: onStepIndexChangeBase,
  } = useBookingEngineNavigation(activeSteps);
  const prevStepRef = useRef(step);

  const goToStepIndexSafe = useCallback(
    (nextIndex: number) => {
      goToStepIndex(nextIndex, {
        fromStep: activeSteps[stepIndex] ?? step,
      });
    },
    [goToStepIndex, activeSteps, stepIndex, step]
  );

  const presetItemName = trimSearchParam(params.itemName);

  const catalog = useBookingEngineCatalog({
    recipeId,
    recipe,
    preset,
    flowBootstrap,
    step,
    locale,
    apiToken,
    t,
    presetItemName,
    selectedBranch,
    selectedService,
    selectedEmployee,
    setBranch,
    setService,
    setEmployee,
    bootstrapState,
    setBootstrapState,
  });

  const {
    profileEmployee,
    profileBranches,
    profileLoading,
    branches,
    services,
    setBranchMinPrices,
    employees,
    employeesLoading,
    employeeNearestSlot,
    loading,
    catalogLoading,
    error,
    setError,
    resolvedBookingPrice,
  } = catalog;

  const multiBranchLegend = usesMultiBranchDatetimeLegend(preset, flowBootstrap);

  const slotHandoffEffects = useBookingEngineSlotHandoffEffects({
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
  });

  const {
    slotServices,
    loadingSlotServices,
    slotServicesError,
    showSlotHandoffSlotGoneBanner,
    handoffAppliedRef,
  } = slotHandoffEffects;

  const submit = useBookingReservationSubmit(client, apiToken);
  const hold = useBookingHold(apiToken);

  const holdFlowSelection = useMemo(
    () => ({
      branchId: selectedBranch?.id,
      itemId: selectedService?.id,
      date: selectedDate,
      slot: selectedSlot,
      selectedEmployee,
      profileEmployee,
    }),
    [
      selectedBranch?.id,
      selectedService?.id,
      selectedDate,
      selectedSlot,
      selectedEmployee,
      profileEmployee,
    ]
  );

  const abandonBookingFlow = useCallback(() => {
    if (fromSlotHandoff || slotHandoff) {
      invalidateListingAvailability({
        employeeId: slotHandoff?.employeeId ?? selectedEmployee?.id ?? profileEmployee?.id,
        branchId: slotHandoff?.branchId ?? selectedBranch?.id,
        serviceId: selectedService?.id,
      });
    }
    handoffAppliedRef.current = false;

    resetSelections();
    setStepIndex(0);
    setSlotHandoff(null);
    setFromSlotHandoff(false);
    void clearDraft();
    void clearBookingSlotContext();
    void clearBookingSlotHandoff();
    void hold.releaseHoldBestEffort();
  }, [
    fromSlotHandoff,
    slotHandoff,
    selectedEmployee?.id,
    profileEmployee?.id,
    selectedBranch?.id,
    selectedService?.id,
    resetSelections,
    setStepIndex,
    clearDraft,
    hold,
  ]);

  const monitorFields = useCallback(
    (stepKind: BookingStepKind) =>
      bookingMonitorFieldsFromSelections({
        recipeId,
        step: stepKind,
        locale,
        selectedBranch,
        selectedService,
        selectedEmployee,
        profileEmployee,
        selectedDate,
        selectedSlot,
      }),
    [
      recipeId,
      locale,
      selectedBranch,
      selectedService,
      selectedEmployee,
      profileEmployee,
      selectedDate,
      selectedSlot,
    ]
  );

  useBookingEngineMonitor({
    client,
    contactContext: submit.contactContext,
    recipeId,
    fromSlotHandoff,
    routeMonitorFrom,
    preset,
    profileLoading,
    profileEmployee,
    step,
    monitorFields,
    submitSuccess: submit.submitSuccess,
    abandonBookingFlow,
  });

  const [employeeNearestChipEmployeeId, setEmployeeNearestChipEmployeeId] = useState<
    string | null
  >(null);

  const datetime = useBookingEngineDatetime({
    step,
    selectedService,
    selectedEmployee,
    profileEmployee,
    selectedBranch,
    profileBranches,
    branches,
    multiBranchLegend,
    selectedDate,
    selectedSlot,
    setDate,
    setSlot,
    holdId: hold.holdId,
    locale,
    apiToken,
    t,
    setError,
    dateLocaleTag,
    monitorFields,
    employeeNearestChipEmployeeId,
    setEmployeeNearestChipEmployeeId,
  });

  const {
    availabilityByBranch,
    loadingCalendar,
    monthOffset,
    setMonthOffset,
    todayIso,
    tomorrowIso,
    monthLabel,
    visibleMonthDays,
    monthCalendarDays,
    datesWithSlots,
    slotsForSelectedDate,
    selectedDateHasNoSlots,
    nearestAvailableDate,
    nearestAvailableDateLabel,
    jumpToNearestAvailableDate,
    refreshCalendar,
  } = datetime;

  const saveCurrentSlotContext = useCallback(
    (slotOverride?: BookingSlot) => {
      const slot = slotOverride ?? selectedSlot;
      const persistedEmployeeId = resolveHoldEmployeeId(
        slot ?? { start: '', end: '' },
        selectedEmployee,
        profileEmployee
      );
      if (
        !selectedBranch?.id ||
        !selectedService?.id ||
        !persistedEmployeeId ||
        !selectedDate ||
        !slot?.start
      ) {
        return;
      }
      void saveBookingSlotContext({
        branchId: selectedBranch.id,
        serviceId: selectedService.id,
        employeeId: persistedEmployeeId,
        date: selectedDate,
        serviceName: selectedService.name,
        servicePrice: resolvedBookingPrice.amount ?? undefined,
        serviceDurationMinutes: selectedService.duration,
        branchAddress: selectedBranch.address?.trim() || undefined,
        slot,
      });
    },
    [
      profileEmployee,
      selectedEmployee,
      selectedBranch,
      selectedService,
      selectedDate,
      selectedSlot,
      resolvedBookingPrice.amount,
    ]
  );

  const buildHoldPayload = useCallback(() => {
    const branch = selectedBranch ?? profileBranches[0];
    if (!branch?.id || !selectedService?.id || !selectedDate || !selectedSlot?.start) {
      return null;
    }
    const employeeId = resolveHoldEmployeeId(
      selectedSlot,
      selectedEmployee,
      profileEmployee
    );
    if (!employeeId) return null;

    return {
      branchId: branch.id,
      itemId: selectedService.id,
      employeeId,
      date: selectedDate,
      slotStart: selectedSlot.start,
      slotEnd: resolveHoldSlotEnd(
        selectedSlot,
        selectedService.duration ?? slotHandoff?.serviceDurationMinutes
      ),
    };
  }, [
    selectedBranch,
    profileBranches,
    selectedService,
    selectedDate,
    selectedSlot,
    selectedEmployee,
    profileEmployee,
    slotHandoff?.serviceDurationMinutes,
  ]);

  const goToDatetimeAfterHoldIssue = useCallback(() => {
    setSlot(null);
    void clearBookingSlotContext();
    refreshCalendar();
    const datetimeIdx = activeSteps.indexOf('datetime');
    if (datetimeIdx >= 0) goToStepIndexSafe(datetimeIdx);
  }, [activeSteps, goToStepIndexSafe, setSlot, refreshCalendar]);

  const createHoldBeforeContact = useCallback(
    async (override?: BookingHoldCreateBody): Promise<boolean> => {
      const body = override ?? buildHoldPayload();
      if (!body) {
        hold.showUnavailableDialog();
        goToDatetimeAfterHoldIssue();
        return false;
      }

      const result = await hold.createHold(body);
      if (result === 'ok') return true;
      if (result === 'conflict') {
        goToDatetimeAfterHoldIssue();
      }
      return false;
    },
    [buildHoldPayload, goToDatetimeAfterHoldIssue, hold]
  );

  const selections = useMemo(() => toBookingSelections(), [toBookingSelections]);

  const onStepIndexChange = useCallback(
    (index: number, reason: 'next' | 'back' | 'skip') => {
      onStepIndexChangeBase(index, reason);
    },
    [onStepIndexChangeBase]
  );

  const leaveBookingFlow = useCallback(() => {
    abandonBookingFlow();
    router.back();
  }, [abandonBookingFlow, router]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStepIndexSafe(stepIndex - 1);
      return;
    }
    leaveBookingFlow();
  }, [stepIndex, goToStepIndexSafe, leaveBookingFlow]);

  const couponEmployeeId = useMemo(() => {
    const employee = profileEmployee ?? selectedEmployee;
    if (!employee?.id || employee.id === ANY_EMPLOYEE_ID) return null;
    return employee.id;
  }, [profileEmployee, selectedEmployee]);

  const couponContext = useMemo(
    () => ({
      employeeId: couponEmployeeId,
      branchId: selectedBranch?.id ?? null,
      itemId: selectedService?.id ?? null,
      phone: submit.contactContext.phone || null,
      email: submit.contactContext.email || null,
      slotStart: selectedSlot?.start ?? null,
      date: selectedDate,
    }),
    [
      couponEmployeeId,
      selectedBranch?.id,
      selectedService?.id,
      submit.contactContext.phone,
      submit.contactContext.email,
      selectedSlot?.start,
      selectedDate,
    ]
  );

  const coupon = useBookingEngineCoupon({
    apiToken,
    context: couponContext,
    t,
    onVerified: (preview) => {
      trackBookingMonitor('coupon_verified', {
        ...monitorFields(step),
        serviceName: preview.couponName ?? null,
      });
    },
    onInvalid: (message) => {
      trackBookingMonitor('coupon_invalid', {
        ...monitorFields(step),
        serviceName: message,
      });
    },
  });

  const trackOpenDiscountCode = useCallback(() => {
    trackBookingMonitor('opened_discount_code', monitorFields(step));
  }, [monitorFields, step]);

  const trackOpenGiftVoucher = useCallback(() => {
    trackBookingMonitor('opened_gift_voucher', monitorFields(step));
  }, [monitorFields, step]);

  useEffect(() => {
    if (step !== 'summary') return;
    if (selectedSlot?.start && selectedDate) return;
    let cancelled = false;
    void readBookingSlotContext().then((stored) => {
      if (cancelled || !stored) return;
      if (preset.branchId && stored.branchId !== preset.branchId) return;
      if (preset.serviceId && stored.serviceId !== preset.serviceId) return;
      if (preset.employeeId && stored.employeeId !== preset.employeeId) return;

      patchSelections((current) => ({
        branch: resolveBranchEntityForSlotRestore(
          stored.branchId,
          current.branch?.id === stored.branchId ? current.branch : null,
          {
            branches,
            profileBranches,
          },
          stored.slot.branchName,
          stored.branchAddress
        ),
        service:
          current.service?.id === stored.serviceId
            ? current.service
            : bookingServiceFromStoredSlotContext(stored),
        employee:
          current.employee?.id === stored.employeeId
            ? current.employee
            : { id: stored.employeeId },
        date: stored.date,
        slot: stored.slot,
      }));
      void hold.releaseHoldBestEffort();
    });
    return () => {
      cancelled = true;
    };
  }, [
    step,
    selectedSlot?.start,
    selectedDate,
    preset.branchId,
    preset.serviceId,
    preset.employeeId,
    branches,
    profileBranches,
    hold,
  ]);

  useEffect(() => {
    if (recipeId !== 'service-detail' || !slotHandoff || !selectedService?.id) return;
    if (slotHandoff.serviceId !== selectedService.id) return;
    if (!selectedBranch?.id || !selectedEmployee?.id || !selectedDate || !selectedSlot?.start) return;
    if (handoffAppliedRef.current) return;

    handoffAppliedRef.current = true;
    const datetimeIdx = activeSteps.indexOf('datetime');
    if (datetimeIdx >= 0 && stepIndex !== datetimeIdx) {
      goToStepIndexSafe(datetimeIdx);
    }
  }, [
    recipeId,
    slotHandoff,
    selectedService?.id,
    selectedBranch?.id,
    selectedEmployee?.id,
    selectedDate,
    selectedSlot?.start,
    activeSteps,
    stepIndex,
    goToStepIndexSafe,
  ]);

  const nextStepAfter = useCallback(
    (kind: BookingStepKind) => {
      const idx = activeSteps.indexOf(kind);
      return activeSteps[idx + 1];
    },
    [activeSteps]
  );

  const advanceAfterSelect = useCallback(
    (kind: BookingStepKind) => {
      const next = nextStepAfter(kind);
      if (!next) return;
      const nextIdx = activeSteps.indexOf(next);
      if (nextIdx >= 0) goToStepIndexSafe(nextIdx);
    },
    [nextStepAfter, activeSteps, goToStepIndexSafe]
  );

  const handleContinue = useCallback(() => {
    if (hold.isCreatingHold) return;
    void (async () => {
      const next = nextStepAfter(step);
      if (!next) return;

      if (step === 'datetime' && selectedSlot?.start) {
        const ok = await createHoldBeforeContact();
        if (!ok) return;
      }

      const nextIdx = activeSteps.indexOf(next);
      if (nextIdx >= 0) goToStepIndexSafe(nextIdx);
    })();
  }, [
    step,
    nextStepAfter,
    activeSteps,
    goToStepIndexSafe,
    selectedSlot?.start,
    createHoldBeforeContact,
    hold.isCreatingHold,
  ]);

  const selectBranch = useCallback(
    (branch: BookingEntity) => {
      setBranch(branch);
      setBranchMinPrices({});
      trackBookingMonitor('selected_branch', {
        ...monitorFields('branch'),
        branchName: branch.name ?? branch.displayName ?? null,
      });
    },
    [monitorFields, setBranch]
  );

  const selectSlotHandoffServiceItem = useCallback(
    (slotService: BookingSlotServiceItem) => {
      const handoff = slotHandoff;
      if (!handoff) return;

      const inSlot = slotService.available === true;
      const next = slotService.nextAvailable;
      const resolvedDate = inSlot ? handoff.date : (next?.date ?? handoff.date);
      const resolvedSlot = {
        ...handoff.slot,
        start: inSlot ? handoff.slot.start : (next?.slotStart ?? handoff.slot.start),
        end: inSlot ? (handoff.slot.end ?? '') : (next?.slotEnd ?? ''),
      };
      const service = mapSlotServiceItemToBookingService(slotService);

      const employee = profileEmployee ?? selectedEmployee ?? {
        id: handoff.employeeId,
        name: handoff.employeeName,
      };
      const branch = resolveBranchEntityForSlotRestore(
        handoff.branchId,
        selectedBranch,
        { branches, profileBranches },
        handoff.slot.branchName ?? handoff.branchName,
        handoff.branchAddress
      );
      setBranch(branch);
      setService(service);
      setEmployee(employee as BookingEntity);
      setDate(resolvedDate);
      setSlot(resolvedSlot);
      promoteBookingMonitorEntryNearestSlot();
      const handoffFields = bookingMonitorFieldsFromSelections({
        recipeId,
        step: 'service',
        locale,
        selectedBranch: branch,
        selectedService: service,
        selectedEmployee: employee as BookingEntity,
        profileEmployee,
        selectedDate: resolvedDate,
        selectedSlot: resolvedSlot,
      });
      trackBookingMonitor('selected_service', handoffFields);
      trackBookingMonitor('selected_slot', {
        ...handoffFields,
        step: 'datetime',
      });

      advanceAfterSelect('service');
    },
    [
      slotHandoff,
      profileEmployee,
      selectedEmployee,
      selectedBranch,
      branches,
      profileBranches,
      recipeId,
      locale,
      advanceAfterSelect,
    ]
  );

  const selectService = useCallback(
    (service: BookingService) => {
      if (recipeId === 'employee-profile' && slotHandoff) {
        const slotService = slotServices.find((item) => item.id === service.id);
        if (slotService) {
          selectSlotHandoffServiceItem(slotService);
        }
        return;
      }
      setService(service);
      void clearBookingSlotHandoff();
      setSlotHandoff(null);
      setFromSlotHandoff(false);
      trackBookingMonitor('selected_service', {
        ...monitorFields('service'),
        serviceName: service.name ?? null,
      });
    },
    [recipeId, slotHandoff, slotServices, selectSlotHandoffServiceItem, monitorFields]
  );

  const selectEmployee = useCallback(
    (employee: BookingEntity) => {
      setEmployee(employee);
      setEmployeeNearestChipEmployeeId(null);
      trackBookingMonitor('selected_employee', {
        ...monitorFields('employee'),
        employeeName: employee.name ?? employee.displayName ?? null,
      });
    },
    [monitorFields, setEmployee]
  );

  const selectEmployeeNearestChip = useCallback(
    (employee: BookingEntity, nearest: { date: string; start: string }) => {
      const dateIso = nearest.date.slice(0, 10);
      const normalizedStart = normalizeBookingSlotStartForMatch(nearest.start);
      patchSelections(() => ({
        employee,
        date: dateIso,
        slot: { start: normalizedStart, end: '' },
      }));
      setEmployeeNearestChipEmployeeId(employee.id);
      const target = calendarTargetFromNearestSlot(dateIso);
      if (target) setMonthOffset(target.monthOffset);
      trackBookingMonitor('selected_employee', {
        ...monitorFields('employee'),
        employeeName: employee.name ?? employee.displayName ?? null,
      });
      trackBookingMonitor('selected_date', {
        ...monitorFields('datetime'),
        date: dateIso,
      });
      trackBookingMonitor('selected_slot', {
        ...monitorFields('datetime'),
        date: dateIso,
        slotStart: normalizedStart,
        employeeName: employee.name ?? employee.displayName ?? null,
      });
    },
    [patchSelections, setMonthOffset, monitorFields]
  );

  const selectDate = useCallback(
    (date: string) => {
      setDate(date);
      setSlot(null);
      setEmployeeNearestChipEmployeeId(null);
      trackBookingMonitor('selected_date', {
        ...monitorFields('datetime'),
        date,
      });
    },
    [monitorFields, setDate, setSlot]
  );

  const selectSlot = useCallback(
    (slot: BookingSlot) => {
      let branch = selectedBranch;
      if (slot.branchId) {
        branch = resolveBranchEntityForSlotRestore(
          slot.branchId,
          selectedBranch,
          { branches, profileBranches },
          slot.branchName
        );
        if (branch.id !== selectedBranch?.id) {
          setBranch(branch, { clearDownstream: false });
        }
      }
      setSlot(slot);
      setEmployeeNearestChipEmployeeId(null);
      const employee = profileEmployee ?? selectedEmployee;
      trackBookingMonitor('selected_slot', {
        ...monitorFields('datetime'),
        branchName: branch?.name ?? branch?.displayName ?? null,
        date: selectedDate ?? undefined,
        slotStart: slot.start,
        slotEnd: slot.end,
        employeeName: employee?.name ?? employee?.displayName ?? null,
      });
      if (branch && selectedService && employee && selectedDate) {
        saveCurrentSlotContext(slot);
      }
    },
    [
      selectedBranch,
      selectedService,
      selectedEmployee,
      profileEmployee,
      selectedDate,
      branches,
      profileBranches,
      monitorFields,
      saveCurrentSlotContext,
    ]
  );

  const employeesForPicker = useMemo(() => {
    if (recipeId === 'service-detail') return employees;
    const anyEmployee: BookingEntity = {
      id: ANY_EMPLOYEE_ID,
      name: t('reservationAnyEmployee'),
      displayName: t('reservationAnyEmployee'),
    };
    return [anyEmployee, ...employees];
  }, [employees, recipeId, t]);

  const handleSubmitSuccess = useCallback(
    async (data: unknown, hadCoupon: boolean) => {
      const successFields = monitorFields('summary');
      if (apiToken) {
        trackBookingMonitor('reservation_no_otp', {
          ...successFields,
          isNewClient: false,
        });
      }
      if (hadCoupon) {
        trackBookingMonitor('coupon_applied', successFields);
      }
      trackBookingMonitor('reservation_success', {
        ...successFields,
        isNewClient: false,
      });
      endBookingMonitorVisitQuietly();

      invalidateListingAvailability({
        employeeId: selectedEmployee?.id ?? profileEmployee?.id,
        branchId: selectedBranch?.id,
        serviceId: selectedService?.id,
      });

      const record = (data ?? {}) as { id?: string; booking?: { id?: string }; reservation?: { id?: string } };
      const createdId = record.id ?? record.booking?.id ?? record.reservation?.id;
      if (createdId && client) {
        const fallback = buildOptimisticBooking({
          id: createdId,
          clientId: client.id,
          employeeId: selectedEmployee?.id ?? profileEmployee?.id ?? '',
          branchId: selectedBranch?.id ?? '',
          itemId: selectedService?.id ?? '',
          date: selectedDate ?? '',
          slotStart: selectedSlot?.start ?? '',
          slotEnd: selectedSlot?.end,
          duration: selectedService?.duration ?? 0,
          price: resolvedBookingPrice.amount ?? 0,
          branch: selectedBranch as never,
          employee: selectedEmployee
            ? {
                id: selectedEmployee.id,
                name: selectedEmployee.name ?? selectedEmployee.displayName ?? '',
                avatarUrl: selectedEmployee.avatarUrl ?? null,
              }
            : profileEmployee
              ? {
                  id: profileEmployee.id,
                  name: profileEmployee.name ?? profileEmployee.displayName ?? '',
                  avatarUrl: profileEmployee.avatarUrl ?? null,
                }
              : null,
          service: selectedService
            ? {
                id: selectedService.id,
                name: selectedService.name ?? '',
                price: resolvedBookingPrice.amount ?? 0,
                duration: selectedService.duration ?? 0,
              }
            : null,
        });
        setFreshBookingSnapshot(fallback);
        setPendingCalendarPromo(createdId);
        setPendingStoreReviewAfterBooking();
        router.replace(`/screens/booking-detail?id=${encodeURIComponent(createdId)}`);
      } else {
        router.replace('/bookings');
      }

      void (async () => {
        await clearBookingSlotContext();
        await clearBookingSlotHandoff();
        await clearDraft();
        await hold.clearHoldLocal();
        await refreshBookings({ force: true });
      })();
    },
    [
      monitorFields,
      apiToken,
      refreshBookings,
      client,
      selectedEmployee,
      profileEmployee,
      selectedBranch,
      selectedService,
      selectedDate,
      selectedSlot,
      clearDraft,
      resolvedBookingPrice.amount,
      hold,
    ]
  );

  const buildSubmitPayload = useCallback(
    (ctx: { firstName: string; lastName: string; email: string; phone: string }) => {
      const holdState = hold.hold;
      const holdId = hold.holdId;
      const employeeId =
        holdState?.employeeId?.trim() ||
        resolveHoldEmployeeId(
          selectedSlot ?? { start: '', end: '' },
          selectedEmployee,
          profileEmployee
        );
      const branchId = holdState?.branchId ?? selectedBranch?.id;
      const itemId = holdState?.itemId ?? selectedService?.id;
      const date = holdState?.date ?? selectedDate;
      const slotStart = holdState?.slotStart ?? selectedSlot?.start;
      const slotEnd = holdState?.slotEnd ?? selectedSlot?.end;

      if (!employeeId || !branchId || !itemId || !date || !slotStart || !holdId) {
        return null;
      }

      return {
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        email: ctx.email,
        phone: ctx.phone,
        employeeId,
        branchId,
        itemId,
        date,
        slotStart,
        holdId,
        ...(slotEnd ? { slotEnd } : {}),
        marketingConsent: false,
        ...(coupon.couponCodeForSubmit ? { couponCode: coupon.couponCodeForSubmit } : {}),
      };
    },
    [
      hold.hold,
      hold.holdId,
      profileEmployee,
      selectedEmployee,
      selectedBranch,
      selectedService,
      selectedDate,
      selectedSlot,
      coupon.couponCodeForSubmit,
    ]
  );

  const handleSubmit = useCallback(() => {
    if (hold.hold && !isStoredHoldConsistentWithFlow({ hold: hold.hold, ...holdFlowSelection })) {
      void hold.releaseHoldBestEffort();
      goToDatetimeAfterHoldIssue();
      return;
    }

    const hadCoupon = Boolean(coupon.couponCodeForSubmit);
    void submit.submitReservation({
      buildPayload: buildSubmitPayload,
      onSuccess: (data) => void handleSubmitSuccess(data, hadCoupon),
      onSlotConflict: () => {
        void hold.releaseHoldBestEffort();
        hold.showUnavailableDialog();
        goToDatetimeAfterHoldIssue();
      },
      formatError: (err) => formatBookingSubmitError(err, t),
    });
  }, [
    submit,
    buildSubmitPayload,
    handleSubmitSuccess,
    coupon.couponCodeForSubmit,
    t,
    hold,
    goToDatetimeAfterHoldIssue,
    holdFlowSelection,
  ]);

  useEffect(() => {
    if (step !== 'summary' || submit.submitSuccess) return;
    void hold.extendOnce();
  }, [step, submit.submitSuccess, hold]);

  useEffect(() => {
    if (step !== 'datetime') return;
    hold.resetExtendOnce();
    if (hold.holdId) {
      void hold.releaseHoldBestEffort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- release once when entering datetime
  }, [step]);

  const handleHoldDialogConfirm = useCallback(() => {
    const kind = hold.dialogKind;
    hold.dismissDialog();
    if (kind === 'expired' || kind === 'unavailable') {
      void hold.releaseHoldBestEffort();
      goToDatetimeAfterHoldIssue();
    }
  }, [goToDatetimeAfterHoldIssue, hold]);

  const bookingSubmitBlockReason = useMemo(
    () =>
      getBookingSubmitBlockReason({
        bookingContactReady: submit.bookingContactReady,
        hold: hold.hold,
        ...holdFlowSelection,
        selectedSlot,
      }),
    [submit.bookingContactReady, hold.hold, holdFlowSelection, selectedSlot]
  );

  const bookingSubmitReady = bookingSubmitBlockReason === null;

  const footerAction = useMemo(
    () =>
      resolveBookingFlowFooterAction({
        step,
        submitSuccess: submit.submitSuccess,
        isSlotHandoffFlow: Boolean(slotHandoff) && step === 'service',
        bookingContactReady: submit.bookingContactReady,
        bookingSubmitReady,
        selections: {
          branch: selectedBranch,
          service: selectedService,
          employee: selectedEmployee,
          date: selectedDate,
          slot: selectedSlot,
        },
        submitting: submit.submitting,
        isCreatingHold: hold.isCreatingHold,
        onContinue: handleContinue,
        onSubmit: handleSubmit,
        labels: {
          continue: t('bookingContinue'),
          submit: step === 'summary' ? t('bookingReserveTerm') : t('commonReserve'),
          submitting: t('bookingSubmitting'),
        },
      }),
    [
      step,
      slotHandoff,
      submit,
      selectedBranch,
      selectedService,
      selectedEmployee,
      selectedDate,
      selectedSlot,
      handleContinue,
      handleSubmit,
      hold.isCreatingHold,
      bookingSubmitReady,
      t,
    ]
  );

  useEffect(() => {
    const prev = prevStepRef.current;
    if (step !== prev) {
      if (prev === 'summary' && step !== 'summary') {
        void clearBookingSlotContext();
      }
      if (step === 'summary' && prev === 'datetime') {
        saveCurrentSlotContext();
      }
      prevStepRef.current = step;
    }
  }, [step, saveCurrentSlotContext]);

  useEffect(() => {
    if (step !== 'summary') return;
    if (resolvedBookingPrice.amount == null) return;
    saveCurrentSlotContext();
  }, [step, resolvedBookingPrice.amount, saveCurrentSlotContext]);

  const bootstrapStatus = useMemo(() => {
    if (recipeId === 'employee-profile' && profileLoading) return 'pending' as const;
    if (recipeId === 'employee-profile' && error && preset.employeeId) return 'error' as const;
    if (loading && branches.length === 0) return 'pending' as const;
    return 'ready' as const;
  }, [recipeId, profileLoading, error, preset.employeeId, loading, branches.length]);

  useEffect(() => {
    if (!hold.hold) return;
    if (step !== 'summary' && bootstrapStatus !== 'ready') return;
    if (isStoredHoldConsistentWithFlow({ hold: hold.hold, ...holdFlowSelection })) return;
    void hold.releaseHoldBestEffort();
  }, [bootstrapStatus, step, hold, hold.hold, holdFlowSelection]);

  const stepLabels = useMemo(
    (): Partial<Record<BookingStepKind, string>> => ({
      branch: t('bookingProgressBranch'),
      service: t('bookingProgressService'),
      employee: t('bookingProgressEmployee'),
      datetime: t('bookingProgressDatetime'),
      summary: t('bookingProgressSummary'),
    }),
    [t]
  );

  return {
    t,
    colors,
    dateLocaleTag,
    recipeId,
    activeSteps,
    step,
    stepIndex,
    stepTitleKey,
    stepLabels,
    goToStepByKind,
    handleBack,
    leaveBookingFlow,
    bootstrapStatus,
    error,
    loading: loading || profileLoading,
    catalogLoading,
    branches,
    profileBranches,
    multiBranchLegend,
    availabilityByBranch,
    services,
    employeesForPicker,
    employeeNearestSlot,
    employeesLoading,
    selectedBranch,
    selectedService,
    selectedEmployee,
    profileEmployee,
    resolvedBookingPrice,
    selectedDate,
    selectedSlot,
    selectBranch,
    selectService,
    selectEmployee,
    selectEmployeeNearestChip,
    employeeNearestChipEmployeeId,
    selectDate,
    selectSlot,
    handleContinue,
    slotHandoff,
    isSlotHandoffFlow: Boolean(slotHandoff),
    slotServices,
    loadingSlotServices,
    slotServicesError,
    showSlotHandoffSlotGoneBanner,
    selectSlotHandoffServiceItem,
    skipDatetime: false,
    monthOffset,
    setMonthOffset,
    monthLabel,
    todayIso,
    tomorrowIso,
    visibleMonthDays,
    monthCalendarDays,
    datesWithSlots,
    slotsForSelectedDate,
    loadingCalendar,
    selectedDateHasNoSlots,
    nearestAvailableDate,
    nearestAvailableDateLabel,
    jumpToNearestAvailableDate,
    showTodayChip: datesWithSlots.includes(todayIso),
    showTomorrowChip: datesWithSlots.includes(tomorrowIso),
    submit,
    bookingSubmitReady,
    bookingSubmitBlockReason,
    coupon,
    hold,
    employees,
    handleHoldDialogConfirm,
    trackOpenDiscountCode,
    trackOpenGiftVoucher,
    footerAction,
    handleSubmit,
    isNextDisabled,
    onStepIndexChange,
    initialStepIndex: 0,
    submitSuccess: submit.submitSuccess,
  };
}

export type BookingEngineFlow = ReturnType<typeof useBookingEngineFlow>;
