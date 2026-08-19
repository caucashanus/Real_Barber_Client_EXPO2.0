import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getBookingBootstrap,
  getBookingBranchCatalog,
  getBookingCalendar,
  getBookingCalendarMultiBranch,
  getBookingEmployeeProfile,
  getBookingServiceContext,
  getBookingSlotServices,
  loadBookingEmployeesWithNearestSlots,
  type BookingHoldCreateBody,
} from '@/api/bookingEngine';
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
  useBookingEngineContact,
} from '@/hooks/useBookingEngineContact';
import { useBookingEngineCoupon } from '@/hooks/useBookingEngineCoupon';
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
import { todayIsoInPrague, addDaysIso } from '@/lib/booking/calendarDate';
import {
  CALENDAR_INITIAL_DAYS,
} from '@/lib/booking/progressiveAvailability';
import {
  getDatesWithSlots,
  getMultiBranchDatesWithSlots,
  getMultiBranchSlotsForDate,
  getSlotsForDate,
  mapCatalogItemToService,
  mapCatalogItemsFromEmployee,
  mapSlotServiceItemToBookingService,
  minPricesFromCatalogItems,
} from '@/lib/booking/booking-api/mappers';
import type { BookingFlatAvailabilityMap, BookingSlotServiceItem } from '@/lib/booking/booking-api/types';
import { isAuthContactComplete } from '@/lib/booking/authContact';
import { resolveBranchName } from '@/lib/booking/designShared';
import {
  branchPriceForServiceId,
  isValidBookingPrice,
  resolveBookingPrice,
} from '@/lib/booking/resolveBookingPrice';
import { resolveBookingFlowFooterAction } from '@/lib/booking/bookingFlowFooter';
import { ensureBookingSessionId } from '@/lib/booking/booking-api/session';
import { resolveHoldEmployeeId } from '@/lib/booking/hold/resolveEmployeeId';
import { resolveHoldSlotEnd } from '@/lib/booking/hold/slotEnd';
import {
  bookingServiceFromStoredSlotContext,
  clearBookingSlotContext,
  readBookingSlotContext,
  resolveBranchEntityForSlotRestore,
  saveBookingSlotContext,
} from '@/lib/booking/engine/navigation/cleanup';
import {
  clearBookingSlotHandoff,
  readBookingSlotHandoff,
  type StoredBookingSlotHandoff,
} from '@/lib/booking/engine/navigation/slotHandoff';
import { getRecipe } from '@/lib/booking/engine/recipes';
import {
  resolveActiveSteps,
  shouldSkipStep,
  usesMultiBranchDatetimeLegend,
} from '@/lib/booking/engine/resolveActiveSteps';
import type { BookingStepKind } from '@/lib/booking/engine/types';
import { bookingMonitorFieldsFromSelections } from '@/lib/booking/monitor/buildFields';
import {
  endBookingMonitorVisitQuietly,
  ensureBookingMonitorSession,
  promoteBookingMonitorEntryNearestSlot,
  setBookingMonitorIdentity,
  trackBookingMonitor,
  trackBookingMonitorLeftPage,
  trackBookingMonitorSessionStarted,
} from '@/lib/booking/monitor/client';
import { setFreshBookingSnapshot } from '@/utils/freshBookingSnapshot';
import { invalidateListingAvailability } from '@/lib/availability/listingCache';
import { buildOptimisticBooking } from '@/utils/optimisticBooking';
import { setPendingCalendarPromo } from '@/utils/pendingCalendarPromo';
import { setPendingStoreReviewAfterBooking } from '@/utils/pendingStoreReview';
import { toIsoDate, calendarTargetFromNearestSlot, findNearestAvailableBookingDate, formatBookingCalendarLongDate, findBookingSlotMatchingStart, normalizeBookingSlotStartForMatch } from '@/utils/reservationCreateHelpers';
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
    case 'contact':
      return 'reservationSummaryTitle';
    case 'summary':
      return 'reservationSummaryTitle';
    default:
      return 'reservationStepBranchTitle';
  }
}

function trimSearchParam(value: string | string[] | undefined | null): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function useBookingEngineFlow() {
  const params = useLocalSearchParams();
  const { apiToken, client } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { refresh: refreshBookings } = useBookings();
  const dateLocaleTag = intlLocaleTag(locale);
  const { recipeId, preset, draftReady, clearDraft, resetSelections, setStepIndex } =
    useBookingEngineContext();
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

  const [bootstrapState, setBootstrapState] = useState<{
    employeeBranchCount?: number;
    employeeProfileMultiBranch?: boolean;
  }>({});
  const [profileEmployee, setProfileEmployee] = useState<BookingEntity | null>(null);
  const [profileBranches, setProfileBranches] = useState<
    { id: string; name?: string; address?: string }[]
  >([]);
  const [profileLoading, setProfileLoading] = useState(recipeId === 'employee-profile');

  const skipContact = Boolean(apiToken && isAuthContactComplete(client));
  const [slotHandoff, setSlotHandoff] = useState<StoredBookingSlotHandoff | null>(null);
  const [fromSlotHandoff, setFromSlotHandoff] = useState(false);

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
      skipContact,
      skipDatetime: false,
      handoffPreset,
    }),
    [bootstrapState, skipContact, handoffPreset]
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
  const slotGoneInvalidatedRef = useRef(false);
  const handoffAppliedRef = useRef(false);

  const [branches, setBranches] = useState<BookingEntity[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [branchMinPrices, setBranchMinPrices] = useState<Record<string, number>>({});
  const [employees, setEmployees] = useState<BookingEntity[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeNearestSlot, setEmployeeNearestSlot] = useState<
    Record<string, { date: string; start: string } | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [slotServices, setSlotServices] = useState<BookingSlotServiceItem[]>([]);
  const [loadingSlotServices, setLoadingSlotServices] = useState(false);
  const [slotServicesError, setSlotServicesError] = useState<string | null>(null);

  const [availabilityData, setAvailabilityData] = useState<{
    availability?: BookingFlatAvailabilityMap;
  } | null>(null);
  const [availabilityByBranch, setAvailabilityByBranch] = useState<
    Record<string, { availability?: BookingFlatAvailabilityMap } | null>
  >({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const [monthOffset, setMonthOffset] = useState(0);
  const todayIso = useMemo(() => todayIsoInPrague(), []);
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  const multiBranchLegend = usesMultiBranchDatetimeLegend(preset, flowBootstrap);
  const contact = useBookingEngineContact(client, apiToken);
  const hold = useBookingHold(apiToken);

  const abandonBookingFlow = useCallback(() => {
    if (fromSlotHandoff || slotHandoff) {
      invalidateListingAvailability({
        employeeId: slotHandoff?.employeeId ?? selectedEmployee?.id ?? profileEmployee?.id,
        branchId: slotHandoff?.branchId ?? selectedBranch?.id,
        serviceId: selectedService?.id,
      });
    }
    slotGoneInvalidatedRef.current = false;
    handoffAppliedRef.current = false;

    resetSelections();
    setStepIndex(0);
    setSlotHandoff(null);
    setFromSlotHandoff(false);
    contact.cancelPhoneOtp();
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
    contact,
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

  const monitorSessionInitRef = useRef(false);

  useEffect(() => {
    setBookingMonitorIdentity({
      client,
      phone: contact.contactContext.phone,
      clientName: contact.contactContext.firstName
        ? `${contact.contactContext.firstName} ${contact.contactContext.lastName}`.trim()
        : null,
    });
  }, [client, contact.contactContext]);

  useEffect(() => {
    if (monitorSessionInitRef.current) return;
    monitorSessionInitRef.current = true;
    ensureBookingMonitorSession({
      recipeId,
      nearestSlotHandoff: fromSlotHandoff,
      from: routeMonitorFrom,
      branchId: preset.branchId,
      employeeId: preset.employeeId,
      serviceId: preset.serviceId,
    });
  }, [
    recipeId,
    fromSlotHandoff,
    routeMonitorFrom,
    preset.branchId,
    preset.employeeId,
    preset.serviceId,
  ]);

  useEffect(() => {
    if (fromSlotHandoff) promoteBookingMonitorEntryNearestSlot();
  }, [fromSlotHandoff]);

  useEffect(() => {
    if (recipeId === 'employee-profile' && profileLoading && !profileEmployee) return;
    trackBookingMonitorSessionStarted(monitorFields(step));
  }, [
    recipeId,
    profileLoading,
    profileEmployee,
    step,
    monitorFields,
  ]);

  const contactEnteredRef = useRef(false);
  useEffect(() => {
    if (step !== 'contact') {
      contactEnteredRef.current = false;
      return;
    }
    if (contactEnteredRef.current) return;
    contactEnteredRef.current = true;
    trackBookingMonitor('entered_contact', monitorFields('contact'));
  }, [step, monitorFields]);

  const summaryEnteredRef = useRef(false);
  useEffect(() => {
    if (step !== 'summary') {
      summaryEnteredRef.current = false;
      return;
    }
    if (summaryEnteredRef.current) return;
    summaryEnteredRef.current = true;
    trackBookingMonitor('entered_summary', monitorFields('summary'));
  }, [step, monitorFields]);

  const leaveMonitorRef = useRef({ submitSuccess: false, fields: monitorFields(step) });
  leaveMonitorRef.current = {
    submitSuccess: contact.submitSuccess,
    fields: monitorFields(step),
  };

  useEffect(() => {
    return () => {
      if (leaveMonitorRef.current.submitSuccess) return;
      trackBookingMonitorLeftPage(leaveMonitorRef.current.fields);
    };
  }, []);

  const flowAbandonRef = useRef({
    submitSuccess: false,
    abandon: () => {},
  });
  flowAbandonRef.current = {
    submitSuccess: contact.submitSuccess,
    abandon: abandonBookingFlow,
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (flowAbandonRef.current.submitSuccess) return;
        flowAbandonRef.current.abandon();
      };
    }, [])
  );

  const holdLeaveRef = useRef({
    submitSuccess: false,
    abandon: () => {},
  });
  holdLeaveRef.current = {
    submitSuccess: contact.submitSuccess,
    abandon: abandonBookingFlow,
  };

  useEffect(() => {
    return () => {
      if (holdLeaveRef.current.submitSuccess) return;
      holdLeaveRef.current.abandon();
    };
  }, []);

  useEffect(() => {
    void ensureBookingSessionId();
  }, []);

  // Bootstrap branches
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getBookingBootstrap(locale, apiToken)
      .then((data) => {
        if (!cancelled) setBranches(data.branches ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, apiToken, t]);

  // Doplnit address z katalogu, pokud CRM address chybí ve vybrané pobočce.
  useEffect(() => {
    if (!selectedBranch?.id || selectedBranch.address?.trim()) return;
    const catalogAddress =
      branches.find((b) => b.id === selectedBranch.id)?.address?.trim() ||
      profileBranches.find((b) => b.id === selectedBranch.id)?.address?.trim();
    if (!catalogAddress) return;
    setBranch({ ...selectedBranch, address: catalogAddress }, { clearDownstream: false });
  }, [selectedBranch, branches, profileBranches, setBranch]);

  // Employee profile bootstrap
  useEffect(() => {
    if (recipeId !== 'employee-profile') {
      setProfileLoading(false);
      return;
    }
    const employeeId = preset.employeeId;
    if (!employeeId) {
      setProfileLoading(false);
      setError('employee_not_found');
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    getBookingEmployeeProfile({ employeeId, locale }, apiToken)
      .then((data) => {
        if (cancelled) return;
        const emp = data.employee;
        if (!emp?.id) {
          setError(t('reservationFromBarberLoadError'));
          return;
        }
        const profileBranchesList = emp.branches ?? [];
        setProfileEmployee(emp);
        setProfileBranches(profileBranchesList);
        setEmployee(emp, { clearDownstream: false });
        setBootstrapState({
          employeeBranchCount: profileBranchesList.length,
          employeeProfileMultiBranch: profileBranchesList.length >= 2,
        });
        setServices(mapCatalogItemsFromEmployee(emp).map(mapCatalogItemToService));
      })
      .catch(() => {
        if (!cancelled) setError(t('reservationFromBarberLoadError'));
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recipeId, preset.employeeId, locale, apiToken, t]);

  // Service detail bootstrap
  useEffect(() => {
    if (recipeId !== 'service-detail' || !preset.serviceId) return;
    let cancelled = false;
    setLoading(true);
    getBookingServiceContext({ itemId: preset.serviceId, locale }, apiToken)
      .then((data) => {
        if (cancelled) return;
        const mapped = mapCatalogItemToService(data.item);
        setServices([mapped]);
        setService(mapped, { clearDownstream: false });
        if (data.branches?.length) setBranches(data.branches);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId, preset.serviceId, locale, apiToken, t]);

  // service-detail: doplnit priceFrom pobočky ze service-context (handoff stub ho nemá)
  useEffect(() => {
    if (recipeId !== 'service-detail' || !selectedBranch?.id || !branches.length) return;
    const match = branches.find((b) => b.id === selectedBranch.id);
    if (!match || !isValidBookingPrice(match.priceFrom)) return;
    if (selectedBranch.priceFrom === match.priceFrom) return;
    setBranch({ ...selectedBranch, priceFrom: match.priceFrom }, { clearDownstream: false });
  }, [recipeId, branches, selectedBranch, setBranch]);

  // Preset branch from params / service-context (včetně doplnění priceFrom u stejného id)
  useEffect(() => {
    if (!preset.branchId || !branches.length) return;
    const branch = branches.find((b) => b.id === preset.branchId);
    if (!branch) return;

    if (selectedBranch?.id !== branch.id) {
      setBranch(branch, { clearDownstream: false });
      return;
    }

    const priceFrom = branch.priceFrom;
    if (isValidBookingPrice(priceFrom) && selectedBranch.priceFrom !== priceFrom) {
      setBranch({ ...selectedBranch, priceFrom }, { clearDownstream: false });
    }
  }, [preset.branchId, branches, selectedBranch, setBranch]);

  // Branch catalog — only while user is picking branch/service (avoid re-fetch on employee step)
  useEffect(() => {
    if (recipeId === 'employee-profile' || recipeId === 'service-detail') return;
    if (!selectedBranch?.id) return;
    if (step !== 'branch' && step !== 'service') return;
    let cancelled = false;
    setLoading(true);
    getBookingBranchCatalog(selectedBranch.id, locale, apiToken)
      .then((data) => {
        if (!cancelled) {
          setServices(data.items.map(mapCatalogItemToService));
          setBranchMinPrices(minPricesFromCatalogItems(data.items));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId, selectedBranch?.id, locale, apiToken, step, t]);

  // Hydrate preset service when the service step is skipped (repeat / deep link).
  useEffect(() => {
    if (recipeId === 'service-detail' || recipeId === 'employee-profile') return;
    if (!preset.serviceId || selectedService?.id === preset.serviceId) return;
    if (!shouldSkipStep('service', preset, flowBootstrap, recipe)) return;
    if (preset.branchId && selectedBranch?.id && selectedBranch.id !== preset.branchId) return;
    if (!services.length) return;

    const match = services.find((service) => service.id === preset.serviceId);
    if (match) {
      setService(match, { clearDownstream: false });
    }
  }, [
    recipeId,
    preset,
    flowBootstrap,
    recipe,
    selectedService?.id,
    selectedBranch?.id,
    services,
  ]);

  // Hydrate preset employee when the employee step is skipped (repeat / deep link).
  useEffect(() => {
    if (recipeId === 'employee-profile') return;
    if (!preset.employeeId) return;
    if (!shouldSkipStep('employee', preset, flowBootstrap, recipe)) return;
    if (preset.branchId && selectedBranch?.id && selectedBranch.id !== preset.branchId) return;
    if (!selectedService?.id) return;

    const fromList = employees.find((employee) => employee.id === preset.employeeId);
    if (fromList) {
      if (selectedEmployee?.id !== fromList.id) {
        setEmployee(fromList, { clearDownstream: false });
      }
      return;
    }

    if (selectedEmployee?.id === preset.employeeId) return;

    setEmployee({ id: preset.employeeId }, { clearDownstream: false });
  }, [
    recipeId,
    preset,
    flowBootstrap,
    recipe,
    selectedBranch?.id,
    selectedService?.id,
    employees,
    selectedEmployee?.id,
  ]);

  // Employee picker (+ dopočet ceny holiče na kontaktu/shrnutí po next-slot handoffu)
  useEffect(() => {
    const hasSelection =
      selectedBranch?.id && selectedService?.id && selectedEmployee?.id;
    const needsEmployeePrice =
      hasSelection &&
      selectedEmployee!.id !== ANY_EMPLOYEE_ID &&
      !isValidBookingPrice(selectedEmployee!.price);
    const shouldLoad =
      step === 'employee' ||
      (step === 'datetime' && Boolean(preset.employeeId)) ||
      ((step === 'contact' || step === 'summary') && needsEmployeePrice);

    if (!shouldLoad || !selectedBranch?.id || !selectedService?.id) {
      if (
        step !== 'employee' &&
        step !== 'datetime' &&
        step !== 'contact' &&
        step !== 'summary'
      ) {
        setEmployees([]);
        setEmployeeNearestSlot({});
      }
      return;
    }
    if (recipeId === 'employee-profile') return;

    let cancelled = false;
    setEmployeesLoading(true);
    loadBookingEmployeesWithNearestSlots({
      branchId: selectedBranch.id,
      itemId: selectedService.id,
      locale,
      apiToken,
    })
      .then(({ employees: list, nearestSlots }) => {
        if (!cancelled) {
          setEmployees(list);
          setEmployeeNearestSlot(nearestSlots);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    step,
    selectedBranch?.id,
    selectedService?.id,
    selectedEmployee,
    recipeId,
    preset.employeeId,
    locale,
    apiToken,
    t,
  ]);

  // Dopočítat cenu holiče z employee-picker po načtení seznamu.
  useEffect(() => {
    if (!selectedEmployee?.id || selectedEmployee.id === ANY_EMPLOYEE_ID) return;
    const match = employees.find((row) => row.id === selectedEmployee.id);
    if (!match?.price || match.price === selectedEmployee.price) return;
    setEmployee({ ...selectedEmployee, price: match.price }, { clearDownstream: false });
  }, [employees, selectedEmployee, setEmployee]);

  const branchPriceForSelectedService = useMemo(() => {
    const fromCatalog = branchPriceForServiceId(selectedService?.id, branchMinPrices);
    if (fromCatalog != null) return fromCatalog;
    if (recipeId === 'service-detail' && isValidBookingPrice(selectedBranch?.priceFrom)) {
      return selectedBranch!.priceFrom!;
    }
    return null;
  }, [selectedService?.id, branchMinPrices, recipeId, selectedBranch?.priceFrom]);

  const resolvedBookingPrice = useMemo(
    () =>
      resolveBookingPrice({
        employee:
          selectedEmployee?.id === ANY_EMPLOYEE_ID ? null : selectedEmployee ?? profileEmployee,
        service: selectedService,
        branch: selectedBranch,
        branchPriceForService: branchPriceForSelectedService,
      }),
    [
      selectedEmployee,
      profileEmployee,
      selectedService,
      selectedBranch,
      branchPriceForSelectedService,
    ]
  );

  const saveCurrentSlotContext = useCallback(
    (slotOverride?: BookingSlot) => {
      const slot = slotOverride ?? selectedSlot;
      const employee = profileEmployee ?? selectedEmployee;
      if (
        !selectedBranch?.id ||
        !selectedService?.id ||
        !employee?.id ||
        !selectedDate ||
        !slot?.start
      ) {
        return;
      }
      void saveBookingSlotContext({
        branchId: selectedBranch.id,
        serviceId: selectedService.id,
        employeeId: employee.id,
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
    setCalendarRefreshKey((value) => value + 1);
    const datetimeIdx = activeSteps.indexOf('datetime');
    if (datetimeIdx >= 0) goToStepIndexWithContact(datetimeIdx);
  }, [activeSteps, goToStepIndexWithContact, setSlot]);

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

  // Slot handoff read (employee-profile)
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
  }, [recipeId, preset.employeeId, branches, profileBranches]);

  // Slot handoff read (service-detail — hairstyle nearest slot)
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
  }, [recipeId, preset.serviceId, branches, profileBranches]);

  // Slot services for handoff service step
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

  // Calendar load
  useEffect(() => {
    if (step !== 'datetime') return;
    if (!selectedService?.id) return;

    const employee = profileEmployee ?? selectedEmployee;
    const employeeId = employee?.id === ANY_EMPLOYEE_ID ? 'any' : employee?.id;
    if (!employeeId) return;

    let cancelled = false;
    setLoadingCalendar(true);
    const from = todayIso;

    if (multiBranchLegend && profileBranches.length >= 2) {
      getBookingCalendarMultiBranch(
        {
          employeeId,
          itemId: selectedService.id,
          from,
          days: CALENDAR_INITIAL_DAYS,
          branchIds: profileBranches.map((b) => b.id),
          locale,
          holdId: hold.holdId,
        },
        apiToken
      )
        .then((data) => {
          if (cancelled) return;
          const next: Record<string, { availability?: BookingFlatAvailabilityMap } | null> = {};
          for (const branch of data.branches ?? []) {
            next[branch.id] = { availability: branch.availability };
          }
          setAvailabilityByBranch(next);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
        })
        .finally(() => {
          if (!cancelled) setLoadingCalendar(false);
        });
    } else {
      const branchId = selectedBranch?.id ?? profileBranches[0]?.id;
      if (!branchId) {
        setLoadingCalendar(false);
        return;
      }
      getBookingCalendar(
        {
          branchId,
          itemId: selectedService.id,
          employeeId,
          from,
          days: CALENDAR_INITIAL_DAYS,
          locale,
          holdId: hold.holdId,
        },
        apiToken
      )
        .then((data) => {
          if (!cancelled) setAvailabilityData({ availability: data.availability });
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : t('reservationErrorGeneric'));
        })
        .finally(() => {
          if (!cancelled) setLoadingCalendar(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    step,
    selectedService?.id,
    selectedEmployee?.id,
    profileEmployee?.id,
    selectedBranch?.id,
    profileBranches,
    multiBranchLegend,
    todayIso,
    locale,
    apiToken,
    t,
    hold.holdId,
    calendarRefreshKey,
  ]);

  const selections = useMemo(() => toBookingSelections(), [toBookingSelections]);

  const navigationOptions = useMemo(
    () => ({
      awaitingOtp: contact.awaitingPhoneOtp,
      clearContactOtp: contact.cancelPhoneOtp,
    }),
    [contact.awaitingPhoneOtp, contact.cancelPhoneOtp]
  );

  const goToStepIndexWithContact = useCallback(
    (nextIndex: number) => {
      goToStepIndex(nextIndex, {
        fromStep: activeSteps[stepIndex] ?? step,
        ...navigationOptions,
      });
    },
    [goToStepIndex, activeSteps, stepIndex, step, navigationOptions]
  );

  const onStepIndexChange = useCallback(
    (index: number, reason: 'next' | 'back' | 'skip') => {
      onStepIndexChangeBase(index, reason, navigationOptions);
    },
    [onStepIndexChangeBase, navigationOptions]
  );

  const leaveBookingFlow = useCallback(() => {
    abandonBookingFlow();
    router.back();
  }, [abandonBookingFlow, router]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStepIndexWithContact(stepIndex - 1);
      return;
    }
    leaveBookingFlow();
  }, [stepIndex, goToStepIndexWithContact, leaveBookingFlow]);

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
      phone: contact.contactContext.phone || null,
      email: contact.contactContext.email || null,
      slotStart: selectedSlot?.start ?? null,
      date: selectedDate,
    }),
    [
      couponEmployeeId,
      selectedBranch?.id,
      selectedService?.id,
      contact.contactContext.phone,
      contact.contactContext.email,
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
    if (step !== 'summary' && step !== 'contact') return;
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
  ]);

  useEffect(() => {
    if (recipeId !== 'service-detail' || !slotHandoff || !selectedService?.id) return;
    if (slotHandoff.serviceId !== selectedService.id) return;
    if (!selectedBranch?.id || !selectedEmployee?.id || !selectedDate || !selectedSlot?.start) return;
    if (handoffAppliedRef.current) return;

    handoffAppliedRef.current = true;
    const datetimeIdx = activeSteps.indexOf('datetime');
    if (datetimeIdx >= 0 && stepIndex !== datetimeIdx) {
      goToStepIndexWithContact(datetimeIdx);
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
    goToStepIndexWithContact,
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
      if (nextIdx >= 0) goToStepIndexWithContact(nextIdx);
    },
    [nextStepAfter, activeSteps, goToStepIndexWithContact]
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
      if (nextIdx >= 0) goToStepIndexWithContact(nextIdx);
    })();
  }, [
    step,
    nextStepAfter,
    activeSteps,
    goToStepIndexWithContact,
    selectedSlot?.start,
    createHoldBeforeContact,
    hold.isCreatingHold,
  ]);

  const [employeeNearestChipEmployeeId, setEmployeeNearestChipEmployeeId] = useState<
    string | null
  >(null);

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
      branchMinPrices,
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

  const datesWithSlots = useMemo(() => {
    if (multiBranchLegend) return getMultiBranchDatesWithSlots(availabilityByBranch);
    return getDatesWithSlots(availabilityData?.availability);
  }, [multiBranchLegend, availabilityByBranch, availabilityData]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    if (multiBranchLegend) return getMultiBranchSlotsForDate(availabilityByBranch, selectedDate);
    return getSlotsForDate(availabilityData?.availability, selectedDate);
  }, [selectedDate, multiBranchLegend, availabilityByBranch, availabilityData]);

  const monthAnchor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = useMemo(
    () =>
      monthAnchor.toLocaleDateString(dateLocaleTag, {
        month: 'long',
        year: 'numeric',
      }),
    [monthAnchor, dateLocaleTag]
  );

  const visibleMonthDays = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: { value: string; label: string }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const value = toIsoDate(date);
      if (value < todayIso) continue;
      if (!datesWithSlots.includes(value)) continue;
      out.push({
        value,
        label: date.toLocaleDateString(dateLocaleTag, { weekday: 'short', day: 'numeric' }),
      });
    }
    return out;
  }, [monthAnchor, dateLocaleTag, todayIso, datesWithSlots]);

  const monthCalendarDays = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<{ value: string; label: string; available: boolean; isToday: boolean }> = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const value = toIsoDate(date);
      if (value < todayIso) continue;
      out.push({
        value,
        label: date.toLocaleDateString(dateLocaleTag, { weekday: 'short', day: 'numeric' }),
        available: datesWithSlots.includes(value),
        isToday: value === todayIso,
      });
    }
    return out;
  }, [monthAnchor, dateLocaleTag, todayIso, datesWithSlots]);

  const nearestAvailableDate = useMemo(
    () => findNearestAvailableBookingDate(datesWithSlots, selectedDate),
    [datesWithSlots, selectedDate]
  );

  const nearestAvailableDateLabel = useMemo(() => {
    if (!nearestAvailableDate) return null;
    return formatBookingCalendarLongDate(nearestAvailableDate, dateLocaleTag);
  }, [nearestAvailableDate, dateLocaleTag]);

  const selectedDateHasNoSlots = Boolean(
    selectedDate && !loadingCalendar && slotsForSelectedDate.length === 0
  );

  const jumpToNearestAvailableDate = useCallback(() => {
    if (!nearestAvailableDate) return;
    const target = calendarTargetFromNearestSlot(nearestAvailableDate);
    if (target) setMonthOffset(target.monthOffset);
    setDate(nearestAvailableDate);
    setSlot(null);
    trackBookingMonitor('selected_date', {
      ...monitorFields('datetime'),
      date: nearestAvailableDate,
    });
  }, [nearestAvailableDate, setDate, setSlot, setMonthOffset, monitorFields]);

  useEffect(() => {
    if (step !== 'datetime' || loadingCalendar) return;
    if (selectedDate) return;
    setDate(todayIso);
  }, [step, loadingCalendar, selectedDate, todayIso, setDate]);

  useEffect(() => {
    if (step !== 'datetime' || loadingCalendar) return;
    if (!employeeNearestChipEmployeeId || !selectedDate || !selectedSlot?.start) return;

    const slots = slotsForSelectedDate;
    if (slots.length === 0) return;

    const matched = findBookingSlotMatchingStart(slots, selectedSlot.start);
    if (!matched) {
      setSlot(null);
      setEmployeeNearestChipEmployeeId(null);
      return;
    }

    const branchName = matched.branchId
      ? resolveBranchName(matched.branchId, branches, profileBranches)
      : undefined;

    const needsUpdate =
      selectedSlot.start !== matched.start ||
      selectedSlot.end !== matched.end ||
      (matched.branchId ?? '') !== (selectedSlot.branchId ?? '') ||
      (matched.employeeId ?? '') !== (selectedSlot.employeeId ?? '');

    if (!needsUpdate) return;

    setSlot({
      start: matched.start,
      end: matched.end,
      branchId: matched.branchId,
      employeeId: matched.employeeId,
      branchName,
    });
  }, [
    step,
    loadingCalendar,
    employeeNearestChipEmployeeId,
    selectedDate,
    selectedSlot,
    slotsForSelectedDate,
    branches,
    profileBranches,
    setSlot,
  ]);

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
      const successFields = monitorFields(skipContact ? 'summary' : 'contact');
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
      skipContact,
      clearDraft,
      resolvedBookingPrice.amount,
      hold,
    ]
  );

  const buildSubmitPayload = useCallback(
    (ctx: { firstName: string; lastName: string; email: string; phone: string }) => {
      const employee = profileEmployee ?? selectedEmployee;
      const branch = selectedBranch;
      const holdId = hold.holdId;
      if (
        !employee?.id ||
        !branch?.id ||
        !selectedService?.id ||
        !selectedDate ||
        !selectedSlot?.start ||
        !holdId
      ) {
        return null;
      }
      return {
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        email: ctx.email,
        phone: ctx.phone,
        employeeId: employee.id === ANY_EMPLOYEE_ID ? 'any' : employee.id,
        branchId: branch.id,
        itemId: selectedService.id,
        date: selectedDate,
        slotStart: selectedSlot.start,
        holdId,
        ...(selectedSlot.end ? { slotEnd: selectedSlot.end } : {}),
        ...(contact.fields.notes.trim() ? { notes: contact.fields.notes.trim() } : {}),
        marketingConsent: contact.fields.marketingConsent,
        ...(coupon.couponCodeForSubmit ? { couponCode: coupon.couponCodeForSubmit } : {}),
      };
    },
    [
      profileEmployee,
      selectedEmployee,
      selectedBranch,
      selectedService,
      selectedDate,
      selectedSlot,
      hold.holdId,
      contact.fields.notes,
      contact.fields.marketingConsent,
      coupon.couponCodeForSubmit,
    ]
  );

  const handleSubmit = useCallback(() => {
    const hadCoupon = Boolean(coupon.couponCodeForSubmit);
    void contact.submitReservation({
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
    contact,
    buildSubmitPayload,
    handleSubmitSuccess,
    coupon.couponCodeForSubmit,
    t,
    hold,
    goToDatetimeAfterHoldIssue,
  ]);

  useEffect(() => {
    const onHoldStep = step === 'contact' || (step === 'summary' && skipContact);
    if (!onHoldStep || contact.submitSuccess) return;
    void hold.extendOnce();
  }, [step, skipContact, contact.submitSuccess, hold]);

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

  const footerAction = useMemo(
    () =>
      resolveBookingFlowFooterAction({
        step,
        submitSuccess: contact.submitSuccess,
        isSlotHandoffFlow: Boolean(slotHandoff) && step === 'service',
        authPrefillReady: contact.authPrefillReady,
        selections: {
          branch: selectedBranch,
          service: selectedService,
          employee: selectedEmployee,
          date: selectedDate,
          slot: selectedSlot,
        },
        awaitingPhoneOtp: contact.awaitingPhoneOtp,
        otpDigits: contact.otpDigits,
        submitting: contact.submitting,
        isCreatingHold: hold.isCreatingHold,
        onContinue: handleContinue,
        onSubmit: handleSubmit,
        labels: {
          continue: t('bookingContinue'),
          submit:
            step === 'contact' || step === 'summary'
              ? t('bookingReserveTerm')
              : t('commonReserve'),
          submitting: t('bookingSubmitting'),
          otpConfirm: t('bookingOtpConfirm'),
          otpVerifying: t('bookingOtpVerifying'),
        },
      }),
    [
      step,
      slotHandoff,
      contact,
      selectedBranch,
      selectedService,
      selectedEmployee,
      selectedDate,
      selectedSlot,
      handleContinue,
      handleSubmit,
      hold.isCreatingHold,
      t,
    ]
  );

  useEffect(() => {
    const prev = prevStepRef.current;
    if (step !== prev) {
      if ((prev === 'contact' || prev === 'summary') && step !== 'contact' && step !== 'summary') {
        void clearBookingSlotContext();
      }
      if ((step === 'contact' || step === 'summary') && prev === 'datetime') {
        saveCurrentSlotContext();
      }
      prevStepRef.current = step;
    }
  }, [step, saveCurrentSlotContext]);

  useEffect(() => {
    if (step !== 'contact' && step !== 'summary') return;
    if (resolvedBookingPrice.amount == null) return;
    saveCurrentSlotContext();
  }, [step, resolvedBookingPrice.amount, saveCurrentSlotContext]);

  const bootstrapStatus = useMemo(() => {
    if (!draftReady) return 'pending' as const;
    if (recipeId === 'employee-profile' && profileLoading) return 'pending' as const;
    if (recipeId === 'employee-profile' && error && preset.employeeId) return 'error' as const;
    if (loading && branches.length === 0) return 'pending' as const;
    return 'ready' as const;
  }, [draftReady, recipeId, profileLoading, error, preset.employeeId, loading, branches.length]);

  const stepLabels = useMemo(
    (): Partial<Record<BookingStepKind, string>> => ({
      branch: t('bookingProgressBranch'),
      service: t('bookingProgressService'),
      employee: t('bookingProgressEmployee'),
      datetime: t('bookingProgressDatetime'),
      contact: t('bookingProgressContact'),
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
    skipContact,
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
    contact,
    coupon,
    hold,
    handleHoldDialogConfirm,
    trackOpenDiscountCode,
    trackOpenGiftVoucher,
    footerAction,
    handleSubmit,
    isNextDisabled,
    onStepIndexChange,
    initialStepIndex: 0,
    submitSuccess: contact.submitSuccess,
  };
}

export type BookingEngineFlow = ReturnType<typeof useBookingEngineFlow>;
