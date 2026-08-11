import { router, useLocalSearchParams } from 'expo-router';
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
} from '@/api/bookingEngine';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useThemeColors from '@/contexts/ThemeColors';
import {
  formatBookingSubmitError,
  useBookingEngineContact,
} from '@/hooks/useBookingEngineContact';
import { useBookingEngineCoupon } from '@/hooks/useBookingEngineCoupon';
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
} from '@/lib/booking/booking-api/mappers';
import type { BookingFlatAvailabilityMap, BookingSlotServiceItem } from '@/lib/booking/booking-api/types';
import { isAuthContactComplete } from '@/lib/booking/authContact';
import { resolveBookingFlowFooterAction } from '@/lib/booking/bookingFlowFooter';
import { ensureBookingSessionId } from '@/lib/booking/booking-api/session';
import {
  applyBookingBackwardCleanup,
  bookingServiceFromStoredSlotContext,
  clearBookingSlotContext,
  computeMaxAllowedStep,
  isStepSatisfiedForKind,
  readBookingSlotContext,
  resolveBranchEntityForSlotRestore,
  saveBookingSlotContext,
} from '@/lib/booking/engine/navigation/cleanup';
import {
  clearBookingSlotHandoff,
  readBookingSlotHandoff,
  type StoredBookingSlotHandoff,
} from '@/lib/booking/engine/navigation/slotHandoff';
import { resolvePresetFromRouteParams } from '@/lib/booking/engine/resolvePresetFromParams';
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
import { buildOptimisticBooking } from '@/utils/optimisticBooking';
import { setPendingCalendarPromo } from '@/utils/pendingCalendarPromo';
import { setPendingStoreReviewAfterBooking } from '@/utils/pendingStoreReview';
import { toIsoDate } from '@/utils/reservationCreateHelpers';

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
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';

  const routeRecipe = trimSearchParam(params.recipe);
  const routeBranchId = trimSearchParam(params.branchId);
  const routeEmployeeId = trimSearchParam(params.employeeId);
  const routeItemId = trimSearchParam(params.itemId);
  const routeBranchSlug = trimSearchParam(params.branchSlug);
  const routeEmployeeSlug = trimSearchParam(params.employeeSlug);
  const routeServiceSlug = trimSearchParam(params.serviceSlug);
  const routeMonitorFrom = trimSearchParam(params.from);

  const { recipeId, preset } = useMemo(
    () =>
      resolvePresetFromRouteParams({
        recipe: routeRecipe,
        branchId: routeBranchId,
        employeeId: routeEmployeeId,
        itemId: routeItemId,
        branchSlug: routeBranchSlug,
        employeeSlug: routeEmployeeSlug,
        serviceSlug: routeServiceSlug,
      }),
    [
      routeRecipe,
      routeBranchId,
      routeEmployeeId,
      routeItemId,
      routeBranchSlug,
      routeEmployeeSlug,
      routeServiceSlug,
    ]
  );
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
  const hasSlotHandoff = Boolean(slotHandoff) || fromSlotHandoff;
  const skipDatetime = skipContact && hasSlotHandoff;

  const flowBootstrap = useMemo(
    () => ({
      ...bootstrapState,
      skipContact,
      skipDatetime,
    }),
    [bootstrapState, skipContact, skipDatetime]
  );

  const activeSteps = useMemo(
    () => resolveActiveSteps(recipe, preset, flowBootstrap),
    [recipe, preset, flowBootstrap]
  );

  const [stepIndex, setStepIndex] = useState(0);
  const step = activeSteps[stepIndex] ?? activeSteps[0] ?? 'branch';
  const prevStepRef = useRef(step);

  const [branches, setBranches] = useState<BookingEntity[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [employees, setEmployees] = useState<BookingEntity[]>([]);
  const [employeeNearestSlot, setEmployeeNearestSlot] = useState<
    Record<string, { date: string; start: string } | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<BookingEntity | null>(null);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<BookingEntity | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

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

  const [monthOffset, setMonthOffset] = useState(0);
  const todayIso = useMemo(() => todayIsoInPrague(), []);
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  const multiBranchLegend = usesMultiBranchDatetimeLegend(preset, flowBootstrap);
  const contact = useBookingEngineContact(client, apiToken);

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

  useEffect(() => {
    void ensureBookingSessionId();
  }, []);

  useEffect(() => {
    if (stepIndex >= activeSteps.length) {
      setStepIndex(Math.max(0, activeSteps.length - 1));
    }
  }, [activeSteps.length, stepIndex]);

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
        setSelectedEmployee(emp);
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
        setSelectedService(mapped);
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

  // Preset branch from params
  useEffect(() => {
    if (!preset.branchId || !branches.length) return;
    const branch = branches.find((b) => b.id === preset.branchId);
    if (branch && selectedBranch?.id !== branch.id) {
      setSelectedBranch(branch);
    }
  }, [preset.branchId, branches, selectedBranch?.id]);

  // Branch catalog
  useEffect(() => {
    if (recipeId === 'employee-profile' || recipeId === 'service-detail') return;
    if (!selectedBranch?.id) return;
    let cancelled = false;
    setLoading(true);
    getBookingBranchCatalog(selectedBranch.id, locale, apiToken)
      .then((data) => {
        if (!cancelled) setServices(data.items.map(mapCatalogItemToService));
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
  }, [recipeId, selectedBranch?.id, locale, apiToken, t]);

  // Hydrate preset service when the service step is skipped (repeat / deep link).
  useEffect(() => {
    if (recipeId === 'service-detail' || recipeId === 'employee-profile') return;
    if (!preset.serviceId || selectedService?.id === preset.serviceId) return;
    if (!shouldSkipStep('service', preset, flowBootstrap, recipe)) return;
    if (preset.branchId && selectedBranch?.id && selectedBranch.id !== preset.branchId) return;
    if (!services.length) return;

    const match = services.find((service) => service.id === preset.serviceId);
    if (match) {
      setSelectedService(match);
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
        setSelectedEmployee(fromList);
      }
      return;
    }

    if (selectedEmployee?.id === preset.employeeId) return;

    setSelectedEmployee({ id: preset.employeeId });
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

  // Employee picker
  useEffect(() => {
    const shouldLoad =
      step === 'employee' ||
      (step === 'datetime' && selectedBranch?.id && selectedService?.id && preset.employeeId);
    if (!shouldLoad || !selectedBranch?.id || !selectedService?.id) return;
    if (recipeId === 'employee-profile') return;

    let cancelled = false;
    setLoading(true);
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
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    step,
    selectedBranch?.id,
    selectedService?.id,
    recipeId,
    preset.employeeId,
    locale,
    apiToken,
    t,
  ]);

  // Slot handoff read (employee-profile)
  useEffect(() => {
    if (recipeId !== 'employee-profile') return;

    let cancelled = false;
    void readBookingSlotHandoff().then((handoff) => {
      if (cancelled || !handoff || handoff.employeeId !== preset.employeeId) return;

      setSlotHandoff(handoff);
      setFromSlotHandoff(true);
      setSelectedBranch((current) => {
        const resolved = resolveBranchEntityForSlotRestore(
          handoff.branchId,
          current,
          { branches, profileBranches },
          handoff.slot.branchName ?? handoff.branchName,
          handoff.branchAddress
        );
        if (current?.id === resolved.id && current?.name === resolved.name) {
          return current;
        }
        return resolved;
      });
      setSelectedDate(handoff.date);
      setSelectedSlot((current) =>
        current?.start === handoff.slot.start && current?.end === handoff.slot.end
          ? current
          : handoff.slot
      );
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
      setSelectedBranch((current) =>
        resolveBranchEntityForSlotRestore(
          handoff.branchId,
          current,
          { branches, profileBranches },
          handoff.slot.branchName ?? handoff.branchName,
          handoff.branchAddress
        )
      );
      setSelectedEmployee((current) =>
        current?.id === handoff.employeeId
          ? current
          : { id: handoff.employeeId, name: handoff.employeeName }
      );
      setSelectedDate(handoff.date);
      setSelectedSlot(handoff.slot);
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
  ]);

  const selections = useMemo(
    () => ({
      branch: selectedBranch ? { id: selectedBranch.id, name: selectedBranch.name } : null,
      service: selectedService ? { id: selectedService.id, name: selectedService.name } : null,
      employee: selectedEmployee ? { id: selectedEmployee.id, name: selectedEmployee.name } : null,
      date: selectedDate,
      slot: selectedSlot,
    }),
    [selectedBranch, selectedService, selectedEmployee, selectedDate, selectedSlot]
  );

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

      setSelectedBranch((current) =>
        current?.id === stored.branchId
          ? current
          : resolveBranchEntityForSlotRestore(stored.branchId, current, {
              branches,
              profileBranches,
            })
      );
      setSelectedService((current) =>
        current?.id === stored.serviceId ? current : bookingServiceFromStoredSlotContext(stored)
      );
      setSelectedEmployee((current) =>
        current?.id === stored.employeeId ? current : { id: stored.employeeId }
      );
      setSelectedDate(stored.date);
      setSelectedSlot(stored.slot);
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

  const goToStepIndex = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(nextIndex, activeSteps.length - 1));
      const fromStep = activeSteps[stepIndex] ?? step;
      const toStep = activeSteps[clamped] ?? step;
      if (clamped < stepIndex) {
        applyBookingBackwardCleanup(fromStep, toStep, activeSteps, {
          setBranch: (b) => setSelectedBranch(b as BookingEntity | null),
          setService: (s) => setSelectedService(s as BookingService | null),
          setEmployee: (e) => setSelectedEmployee(e as BookingEntity | null),
          setDate: setSelectedDate,
          setSlot: setSelectedSlot,
        }, {
          awaitingOtp: contact.awaitingPhoneOtp,
          clearContactOtp: contact.cancelPhoneOtp,
        });
      }
      setStepIndex(clamped);
    },
    [activeSteps, stepIndex, step, contact.awaitingPhoneOtp, contact.cancelPhoneOtp]
  );

  useEffect(() => {
    if (recipeId !== 'service-detail' || !slotHandoff || !selectedService?.id) return;
    if (slotHandoff.serviceId !== selectedService.id) return;
    if (!selectedBranch?.id || !selectedEmployee?.id || !selectedDate || !selectedSlot?.start) return;

    void saveBookingSlotContext({
      branchId: selectedBranch.id,
      serviceId: selectedService.id,
      employeeId: selectedEmployee.id,
      date: selectedDate,
      serviceName: selectedService.name,
      servicePrice: selectedService.pricing?.minPrice,
      serviceDurationMinutes:
        slotHandoff.serviceDurationMinutes ?? selectedService.duration ?? undefined,
      slot: selectedSlot,
    });

    if (!skipContact) return;
    const contactIdx = activeSteps.indexOf('contact');
    if (contactIdx >= 0 && stepIndex !== contactIdx) {
      goToStepIndex(contactIdx);
    }
  }, [
    recipeId,
    slotHandoff,
    selectedService,
    selectedBranch?.id,
    selectedEmployee?.id,
    selectedDate,
    selectedSlot,
    skipContact,
    activeSteps,
    stepIndex,
    goToStepIndex,
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
      if (nextIdx >= 0) goToStepIndex(nextIdx);
    },
    [nextStepAfter, activeSteps, goToStepIndex]
  );

  const selectBranch = useCallback(
    (branch: BookingEntity) => {
      setSelectedBranch(branch);
      setSelectedEmployee(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      trackBookingMonitor('selected_branch', {
        ...monitorFields('branch'),
        branchName: branch.name ?? branch.displayName ?? null,
      });
      advanceAfterSelect('branch');
    },
    [advanceAfterSelect, monitorFields]
  );

  const selectSlotHandoffService = useCallback(
    (service: BookingService) => {
      const handoff = slotHandoff;
      if (!handoff) return;
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
      setSelectedBranch(branch);
      setSelectedService(service);
      setSelectedEmployee(employee as BookingEntity);
      setSelectedDate(handoff.date);
      setSelectedSlot(handoff.slot);
      promoteBookingMonitorEntryNearestSlot();
      const handoffFields = bookingMonitorFieldsFromSelections({
        recipeId,
        step: 'service',
        locale,
        selectedBranch: branch,
        selectedService: service,
        selectedEmployee: employee as BookingEntity,
        profileEmployee,
        selectedDate: handoff.date,
        selectedSlot: handoff.slot,
      });
      trackBookingMonitor('selected_service', handoffFields);
      trackBookingMonitor('selected_slot', {
        ...handoffFields,
        step: 'datetime',
      });
      void saveBookingSlotContext({
        branchId: branch.id,
        serviceId: service.id,
        employeeId: employee.id!,
        date: handoff.date,
        serviceName: service.name,
        servicePrice: service.pricing?.minPrice,
        serviceDurationMinutes: service.duration,
        slot: handoff.slot,
      });
      if (!skipContact) {
        void clearBookingSlotHandoff();
        setSlotHandoff(null);
        const contactIdx = activeSteps.indexOf('contact');
        if (contactIdx >= 0) goToStepIndex(contactIdx);
        return;
      }
      void clearBookingSlotHandoff();
      setSlotHandoff(null);
      advanceAfterSelect('service');
    },
    [
      slotHandoff,
      profileEmployee,
      selectedEmployee,
      selectedBranch,
      branches,
      profileBranches,
      skipContact,
      activeSteps,
      goToStepIndex,
      advanceAfterSelect,
      recipeId,
      locale,
    ]
  );

  const selectService = useCallback(
    (service: BookingService) => {
      if (recipeId === 'employee-profile' && slotHandoff) {
        selectSlotHandoffService(service);
        return;
      }
      setSelectedService(service);
      if (recipeId !== 'employee-profile') setSelectedEmployee(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      void clearBookingSlotHandoff();
      setSlotHandoff(null);
      setFromSlotHandoff(false);
      trackBookingMonitor('selected_service', {
        ...monitorFields('service'),
        serviceName: service.name ?? null,
      });
      advanceAfterSelect('service');
    },
    [recipeId, slotHandoff, selectSlotHandoffService, advanceAfterSelect, monitorFields]
  );

  const selectEmployee = useCallback(
    (employee: BookingEntity) => {
      setSelectedEmployee(employee);
      setSelectedDate(null);
      setSelectedSlot(null);
      trackBookingMonitor('selected_employee', {
        ...monitorFields('employee'),
        employeeName: employee.name ?? employee.displayName ?? null,
      });
      advanceAfterSelect('employee');
    },
    [advanceAfterSelect, monitorFields]
  );

  const selectDate = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setSelectedSlot(null);
      trackBookingMonitor('selected_date', {
        ...monitorFields('datetime'),
        date,
      });
    },
    [monitorFields]
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
        setSelectedBranch(branch);
      }
      setSelectedSlot(slot);
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
        void saveBookingSlotContext({
          branchId: branch.id,
          serviceId: selectedService.id,
          employeeId: employee.id,
          date: selectedDate,
          slot,
        });
      }
      advanceAfterSelect('datetime');
    },
    [
      selectedBranch,
      selectedService,
      selectedEmployee,
      profileEmployee,
      selectedDate,
      branches,
      profileBranches,
      advanceAfterSelect,
      monitorFields,
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

      await clearBookingSlotContext();
      await clearBookingSlotHandoff();
      await refreshBookings({ force: true });
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
          price: selectedService?.pricing?.minPrice ?? 0,
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
                price: selectedService.pricing?.minPrice ?? 0,
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
    ]
  );

  const buildSubmitPayload = useCallback(
    (ctx: { firstName: string; lastName: string; email: string; phone: string }) => {
      const employee = profileEmployee ?? selectedEmployee;
      const branch = selectedBranch;
      if (!employee?.id || !branch?.id || !selectedService?.id || !selectedDate || !selectedSlot?.start) {
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
        setSelectedSlot(null);
        void clearBookingSlotContext();
      },
      formatError: (err) => formatBookingSubmitError(err, t),
    });
  }, [contact, buildSubmitPayload, handleSubmitSuccess, coupon.couponCodeForSubmit, t]);

  const footerAction = useMemo(
    () =>
      resolveBookingFlowFooterAction({
        isContactStep: step === 'contact',
        isSummaryStep: step === 'summary',
        authPrefillReady: contact.authPrefillReady,
        submitSuccess: contact.submitSuccess,
        selectedSlot,
        selectedService,
        awaitingPhoneOtp: contact.awaitingPhoneOtp,
        otpDigits: contact.otpDigits,
        submitting: contact.submitting,
        onSubmit: handleSubmit,
        labels: {
          submit:
            step === 'contact' || step === 'summary'
              ? t('bookingReserveTerm')
              : t('commonReserve'),
          submitting: t('reservationCreating'),
          otpConfirm: t('bookingOtpConfirm'),
          otpVerifying: t('reservationCreating'),
        },
      }),
    [
      step,
      skipContact,
      contact,
      selectedSlot,
      selectedService,
      handleSubmit,
      t,
    ]
  );

  const isNextDisabled = useCallback(
    (index: number) => {
      const kind = activeSteps[index];
      if (!kind) return true;
      return !isStepSatisfiedForKind(kind, selections);
    },
    [activeSteps, selections]
  );

  const onStepIndexChange = useCallback(
    (index: number, reason: 'next' | 'back' | 'skip') => {
      if (reason === 'back') {
        goToStepIndex(index);
        return;
      }
      const maxAllowed = computeMaxAllowedStep(activeSteps, selections);
      const maxIdx = activeSteps.indexOf(maxAllowed);
      if (index > maxIdx) {
        goToStepIndex(maxIdx);
        return;
      }
      setStepIndex(index);
    },
    [goToStepIndex, activeSteps, selections]
  );

  useEffect(() => {
    const prev = prevStepRef.current;
    if (step !== prev) {
      if ((prev === 'contact' || prev === 'summary') && step !== 'contact' && step !== 'summary') {
        void clearBookingSlotContext();
      }
      prevStepRef.current = step;
    }
  }, [step]);

  const bootstrapStatus = useMemo(() => {
    if (recipeId === 'employee-profile' && profileLoading) return 'pending' as const;
    if (recipeId === 'employee-profile' && error && preset.employeeId) return 'error' as const;
    if (loading && branches.length === 0) return 'pending' as const;
    return 'ready' as const;
  }, [recipeId, profileLoading, error, preset.employeeId, loading, branches.length]);

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

  const goToStepByKind = useCallback(
    (kind: BookingStepKind) => {
      const targetIdx = activeSteps.indexOf(kind);
      if (targetIdx === -1 || targetIdx >= stepIndex) return;
      goToStepIndex(targetIdx);
    },
    [activeSteps, stepIndex, goToStepIndex]
  );

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStepIndex(stepIndex - 1);
      return;
    }
    router.back();
  }, [stepIndex, goToStepIndex]);

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
    selectedBranch,
    selectedService,
    selectedEmployee,
    profileEmployee,
    selectedDate,
    selectedSlot,
    selectBranch,
    selectService,
    selectEmployee,
    selectDate,
    selectSlot,
    slotHandoff,
    isSlotHandoffFlow: Boolean(slotHandoff),
    slotServices,
    loadingSlotServices,
    slotServicesError,
    skipContact,
    skipDatetime,
    monthOffset,
    setMonthOffset,
    monthLabel,
    todayIso,
    tomorrowIso,
    visibleMonthDays,
    datesWithSlots,
    slotsForSelectedDate,
    loadingCalendar,
    showTodayChip: datesWithSlots.includes(todayIso),
    showTomorrowChip: datesWithSlots.includes(tomorrowIso),
    contact,
    coupon,
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
