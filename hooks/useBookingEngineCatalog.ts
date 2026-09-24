import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import {
  getBookingBootstrap,
  getBookingBranchCatalog,
  getBookingEmployeeProfile,
  getBookingServiceContext,
  loadBookingEmployeesWithNearestSlots,
} from '@/api/bookingEngine';
import { ANY_EMPLOYEE_ID, type BookingEntity, type BookingService } from '@/lib/booking/constants';
import {
  mapCatalogItemToService,
  mapCatalogItemsFromEmployee,
  minPricesFromCatalogItems,
} from '@/lib/booking/booking-api/mappers';
import { bookingIdsEqual } from '@/lib/booking/engine/flowParamUtils';
import { shouldSkipStep } from '@/lib/booking/engine/resolveActiveSteps';
import type {
  BookingBootstrap,
  BookingPreset,
  BookingRecipe,
  BookingRecipeId,
  BookingStepKind,
} from '@/lib/booking/engine/types';
import {
  branchPriceForServiceId,
  isValidBookingPrice,
  resolveBookingPrice,
} from '@/lib/booking/resolveBookingPrice';
import { ensureBookingSessionId } from '@/lib/booking/booking-api/session';
import type { TranslationKey } from '@/locales';

export function useBookingEngineCatalog(params: {
  recipeId: BookingRecipeId;
  recipe: BookingRecipe;
  preset: BookingPreset;
  flowBootstrap: BookingBootstrap;
  step: BookingStepKind;
  locale: string;
  apiToken: string | null;
  t: (key: TranslationKey) => string;
  presetItemName?: string;
  selectedBranch: BookingEntity | null;
  selectedService: BookingService | null;
  selectedEmployee: BookingEntity | null;
  setBranch: (branch: BookingEntity | null, options?: { clearDownstream?: boolean }) => void;
  setService: (service: BookingService | null, options?: { clearDownstream?: boolean }) => void;
  setEmployee: (employee: BookingEntity | null, options?: { clearDownstream?: boolean }) => void;
  bootstrapState: {
    employeeBranchCount?: number;
    employeeProfileMultiBranch?: boolean;
  };
  setBootstrapState: Dispatch<
    SetStateAction<{
      employeeBranchCount?: number;
      employeeProfileMultiBranch?: boolean;
    }>
  >;
}) {
  const {
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
  } = params;

  const [profileEmployee, setProfileEmployee] = useState<BookingEntity | null>(null);
  const [profileBranches, setProfileBranches] = useState<
    { id: string; name?: string; address?: string }[]
  >([]);
  const [profileLoading, setProfileLoading] = useState(recipeId === 'employee-profile');

  const [branches, setBranches] = useState<BookingEntity[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [branchMinPrices, setBranchMinPrices] = useState<Record<string, number>>({});
  const [employees, setEmployees] = useState<BookingEntity[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeNearestSlot, setEmployeeNearestSlot] = useState<
    Record<string, { date: string; start: string } | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void ensureBookingSessionId();
  }, []);

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

  useEffect(() => {
    if (!selectedBranch?.id || selectedBranch.address?.trim()) return;
    const catalogAddress =
      branches.find((b) => b.id === selectedBranch.id)?.address?.trim() ||
      profileBranches.find((b) => b.id === selectedBranch.id)?.address?.trim();
    if (!catalogAddress) return;
    setBranch({ ...selectedBranch, address: catalogAddress }, { clearDownstream: false });
  }, [selectedBranch, branches, profileBranches, setBranch]);

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
  }, [recipeId, preset.employeeId, locale, apiToken, t, setEmployee]);

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
  }, [recipeId, preset.serviceId, locale, apiToken, t, setService]);

  useEffect(() => {
    if (recipeId !== 'service-detail' || !selectedBranch?.id || !branches.length) return;
    const match = branches.find((b) => b.id === selectedBranch.id);
    if (!match || !isValidBookingPrice(match.priceFrom)) return;
    if (selectedBranch.priceFrom === match.priceFrom) return;
    setBranch({ ...selectedBranch, priceFrom: match.priceFrom }, { clearDownstream: false });
  }, [recipeId, branches, selectedBranch, setBranch]);

  useEffect(() => {
    if (!preset.branchId || !branches.length) return;
    const branch = branches.find((b) => bookingIdsEqual(b.id, preset.branchId));
    if (!branch) return;

    if (!bookingIdsEqual(selectedBranch?.id, branch.id)) {
      setBranch(branch, { clearDownstream: false });
      return;
    }

    const priceFrom = branch.priceFrom;
    if (
      selectedBranch &&
      isValidBookingPrice(priceFrom) &&
      selectedBranch.priceFrom !== priceFrom
    ) {
      setBranch({ ...selectedBranch, priceFrom }, { clearDownstream: false });
    }
  }, [preset.branchId, branches, selectedBranch, setBranch]);

  useEffect(() => {
    if (recipeId === 'employee-profile' || recipeId === 'service-detail') return;
    if (!selectedBranch?.id) return;

    const needsCatalogForSkippedService =
      Boolean(preset.serviceId) &&
      shouldSkipStep('service', preset, flowBootstrap, recipe) &&
      services.length === 0;

    if (step !== 'branch' && step !== 'service' && !needsCatalogForSkippedService) return;

    let cancelled = false;
    setCatalogLoading(true);
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
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    recipeId,
    selectedBranch?.id,
    locale,
    apiToken,
    step,
    t,
    preset.serviceId,
    preset,
    flowBootstrap,
    recipe,
    services.length,
  ]);

  useEffect(() => {
    if (recipeId === 'service-detail' || recipeId === 'employee-profile') return;
    if (!preset.serviceId || bookingIdsEqual(selectedService?.id, preset.serviceId)) return;
    if (!shouldSkipStep('service', preset, flowBootstrap, recipe)) return;
    if (
      preset.branchId &&
      selectedBranch?.id &&
      !bookingIdsEqual(selectedBranch.id, preset.branchId)
    ) {
      return;
    }

    const match = services.find((service) => bookingIdsEqual(service.id, preset.serviceId));
    if (match) {
      setService(match, { clearDownstream: false });
      return;
    }

    if (!services.length) return;
    setService(
      { id: preset.serviceId, ...(presetItemName ? { name: presetItemName } : {}) },
      { clearDownstream: false }
    );
  }, [
    recipeId,
    preset,
    flowBootstrap,
    recipe,
    selectedService?.id,
    selectedBranch?.id,
    services,
    presetItemName,
    setService,
  ]);

  useEffect(() => {
    if (recipeId === 'employee-profile') return;
    if (!preset.employeeId) return;
    if (!shouldSkipStep('employee', preset, flowBootstrap, recipe)) return;
    if (
      preset.branchId &&
      selectedBranch?.id &&
      !bookingIdsEqual(selectedBranch.id, preset.branchId)
    ) {
      return;
    }
    if (!selectedService?.id) return;

    const fromList = employees.find((employee) => bookingIdsEqual(employee.id, preset.employeeId));
    if (fromList) {
      if (!bookingIdsEqual(selectedEmployee?.id, fromList.id)) {
        setEmployee(fromList, { clearDownstream: false });
      }
      return;
    }

    if (bookingIdsEqual(selectedEmployee?.id, preset.employeeId)) return;

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
    setEmployee,
  ]);

  useEffect(() => {
    const hasSelection = selectedBranch?.id && selectedService?.id && selectedEmployee?.id;
    const needsEmployeePrice =
      hasSelection &&
      selectedEmployee!.id !== ANY_EMPLOYEE_ID &&
      !isValidBookingPrice(selectedEmployee!.price);
    const shouldLoad =
      step === 'employee' ||
      (step === 'datetime' && Boolean(preset.employeeId)) ||
      (step === 'summary' && needsEmployeePrice);

    if (!shouldLoad || !selectedBranch?.id || !selectedService?.id) {
      if (step !== 'employee' && step !== 'datetime' && step !== 'summary') {
        setEmployees([]);
        setEmployeeNearestSlot({});
      }
      return;
    }
    if (recipeId === 'employee-profile') return;

    let cancelled = false;
    if (employees.length === 0) {
      setEmployeesLoading(true);
    }
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
    selectedEmployee?.id,
    selectedEmployee?.price,
    recipeId,
    preset.employeeId,
    locale,
    apiToken,
    t,
    employees.length,
  ]);

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

  return {
    profileEmployee,
    profileBranches,
    profileLoading,
    branches,
    services,
    branchMinPrices,
    setBranchMinPrices,
    employees,
    employeesLoading,
    employeeNearestSlot,
    loading,
    catalogLoading,
    error,
    setError,
    resolvedBookingPrice,
  };
}
