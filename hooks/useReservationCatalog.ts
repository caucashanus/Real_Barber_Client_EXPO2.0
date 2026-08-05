import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ReservationFlowDataState,
  ReservationMonthState,
} from './reservationCreateFlowShared';

import { getEmployeesNearest, type EmployeesNearestNextSlot } from '@/api/availability';
import { getBranchById, type Branch, type BranchEmployee } from '@/api/branches';
import { getEmployeeById, type Employee, type EmployeeService } from '@/api/employees';
import type { TranslationKey } from '@/locales';
import { isEmployeePubliclyBookable } from '@/utils/employeePublicBooking';
import {
  type BarberEntryMode,
  type ServiceOption,
  buildBranchServicePickerData,
  buildReservationServiceStepCategories,
  calendarTargetFromNearestSlot,
  employeeNearestSortKey,
  findServiceOptionOnBranch,
  getEmployeeServicesList,
  getEmployeesList,
  mergeAggregatedEmployeeServices,
  mergeEmployee,
  serviceOptionFromEmployeeService,
} from '@/utils/reservationCreateHelpers';

interface UseReservationCatalogParams extends ReservationFlowDataState, ReservationMonthState {
  apiToken: string | null;
  branches: Branch[];
  employeesById: Record<string, Employee>;
  presetEmployeeId: string | undefined;
  presetItemId: string | undefined;
  presetBranchFilterIds: Set<string> | null;
  barberEntryMode: BarberEntryMode;
  t: (key: TranslationKey) => string;
}

export function useReservationCatalog({
  apiToken,
  branches,
  employeesById,
  data,
  setData,
  presetEmployeeId,
  presetItemId,
  presetBranchFilterIds,
  barberEntryMode,
  setLastSelectedDateByMonth,
  setMonthOffset,
  t,
}: UseReservationCatalogParams) {
  const branchesRef = useRef<Branch[]>([]);
  branchesRef.current = branches;
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [aggregatedBranchServices, setAggregatedBranchServices] = useState<{
    options: ServiceOption[];
    offerersByServiceId: Map<string, Set<string>>;
  } | null>(null);
  const [loadingAggregatedBranchServices, setLoadingAggregatedBranchServices] = useState(false);
  const [branchServicesSource, setBranchServicesSource] = useState<Branch | null>(null);
  const [loadingBranchServicesFetch, setLoadingBranchServicesFetch] = useState(false);
  const [employeesNearestMap, setEmployeesNearestMap] = useState<Map<
    string,
    { price: number; nextSlot: EmployeesNearestNextSlot | null }
  > | null>(null);
  const [loadingEmployeesNearest, setLoadingEmployeesNearest] = useState(false);
  const nearestCalendarEmployeeRef = useRef<string | null>(null);

  const applyNearestCalendarForEmployee = useCallback(
    (employeeId: string) => {
      const iso = employeesNearestMap?.get(employeeId)?.nextSlot?.date;
      if (!iso) {
        setMonthOffset(0);
        nearestCalendarEmployeeRef.current = employeeId;
        return;
      }
      const target = calendarTargetFromNearestSlot(iso);
      if (!target) return;
      setMonthOffset(target.monthOffset);
      setLastSelectedDateByMonth((prev) => ({ ...prev, [target.monthKey]: target.dateIso }));
      nearestCalendarEmployeeRef.current = employeeId;
    },
    [employeesNearestMap, setMonthOffset, setLastSelectedDateByMonth]
  );

  const selectBranchId = useCallback(
    (branchId: string) => {
      let branchChanged = false;
      setData((prev) => {
        if (prev.branchId === branchId) return prev;
        branchChanged = true;
        const b = branches.find((x) => x.id === branchId);
        let nextDuration = 0;
        if (presetItemId && b) {
          const svc = findServiceOptionOnBranch(b, presetItemId);
          nextDuration = svc?.duration ?? prev.duration ?? 0;
        }
        return {
          ...prev,
          branchId,
          employeeId: presetEmployeeId ? presetEmployeeId : '',
          itemId: presetItemId ? presetItemId : '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: presetItemId ? nextDuration : 0,
        };
      });
      if (branchChanged) {
        setLastSelectedDateByMonth({});
        setMonthOffset(0);
        nearestCalendarEmployeeRef.current = null;
      }
    },
    [presetEmployeeId, presetItemId, branches, setData, setLastSelectedDateByMonth, setMonthOffset]
  );

  const selectEmployee = useCallback(
    (employeeId: string) => {
      nearestCalendarEmployeeRef.current = null;
      setData((prev) => ({
        ...prev,
        employeeId,
        itemId: prev.itemId,
        date: '',
        slotStart: '',
        slotEnd: '',
        duration: prev.duration,
      }));
      setLastSelectedDateByMonth({});
      applyNearestCalendarForEmployee(employeeId);
    },
    [setData, setLastSelectedDateByMonth, applyNearestCalendarForEmployee]
  );

  const selectServiceOption = useCallback(
    (service: ServiceOption) => {
      const keepEmp =
        (barberEntryMode === 'multi' || barberEntryMode === 'single') && Boolean(presetEmployeeId);
      setData((prev) => ({
        ...prev,
        itemId: service.id,
        employeeId: keepEmp ? presetEmployeeId! : '',
        date: '',
        slotStart: '',
        slotEnd: '',
        duration: service.duration,
      }));
      setLastSelectedDateByMonth({});
      nearestCalendarEmployeeRef.current = null;
      setMonthOffset(0);
    },
    [barberEntryMode, presetEmployeeId, setData, setLastSelectedDateByMonth, setMonthOffset]
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === data.branchId) ?? null,
    [branches, data.branchId]
  );

  useEffect(() => {
    if (!apiToken || !data.branchId?.trim()) {
      setBranchServicesSource(null);
      setLoadingBranchServicesFetch(false);
      return;
    }
    let cancelled = false;
    setBranchServicesSource(null);
    setLoadingBranchServicesFetch(true);
    setAggregatedBranchServices(null);
    getBranchById(apiToken, data.branchId.trim())
      .then((b) => {
        if (!cancelled) setBranchServicesSource(b);
      })
      .catch(() => {
        if (!cancelled) {
          setBranchServicesSource(branchesRef.current.find((x) => x.id === data.branchId) ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBranchServicesFetch(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.branchId]);

  const branchForServiceStep = branchServicesSource ?? selectedBranch;

  const branchPickerFromBranchPayload = useMemo(
    () => buildBranchServicePickerData(branchForServiceStep),
    [branchForServiceStep]
  );

  useEffect(() => {
    if (!apiToken || !selectedBranch?.id) {
      setAggregatedBranchServices(null);
      setLoadingAggregatedBranchServices(false);
      return;
    }
    if (loadingBranchServicesFetch) {
      return;
    }
    if (branchPickerFromBranchPayload.options.length > 0) {
      setAggregatedBranchServices(null);
      setLoadingAggregatedBranchServices(false);
      return;
    }
    const emps = getEmployeesList(branchForServiceStep)
      .map((e) => mergeEmployee(e, employeesById[e.id]))
      .filter((e) => e.isActive !== false && isEmployeePubliclyBookable(e));
    if (emps.length === 0) {
      setAggregatedBranchServices(null);
      setLoadingAggregatedBranchServices(false);
      return;
    }
    let cancelled = false;
    setLoadingAggregatedBranchServices(true);
    setAggregatedBranchServices(null);
    Promise.all(
      emps.map((e) =>
        getEmployeeById(apiToken, e.id)
          .then((emp) => ({
            employeeId: e.id,
            services: getEmployeeServicesList(emp.services),
          }))
          .catch(() => ({ employeeId: e.id, services: [] as EmployeeService[] }))
      )
    )
      .then((results) => {
        if (cancelled) return;
        setAggregatedBranchServices(mergeAggregatedEmployeeServices(results));
      })
      .finally(() => {
        if (!cancelled) setLoadingAggregatedBranchServices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    apiToken,
    selectedBranch,
    branchForServiceStep,
    loadingBranchServicesFetch,
    branchPickerFromBranchPayload.options.length,
    employeesById,
  ]);

  const branchesForReservation = useMemo(() => {
    if (presetBranchFilterIds != null && presetBranchFilterIds.size > 0) {
      return branches.filter((b) => presetBranchFilterIds.has(b.id));
    }
    return branches;
  }, [branches, presetBranchFilterIds]);

  const employeesAll = useMemo(
    () =>
      getEmployeesList(branchForServiceStep)
        .map((e) => mergeEmployee(e, employeesById[e.id]))
        .filter((e) => e.isActive !== false && isEmployeePubliclyBookable(e)),
    [branchForServiceStep, employeesById]
  );

  const serviceOfferersByItemId = useMemo(() => {
    if (branchPickerFromBranchPayload.options.length > 0) {
      return branchPickerFromBranchPayload.offerersByServiceId;
    }
    return aggregatedBranchServices?.offerersByServiceId ?? new Map<string, Set<string>>();
  }, [branchPickerFromBranchPayload, aggregatedBranchServices]);

  const employees = useMemo(() => {
    if (!data.itemId) return employeesAll;
    const ids = serviceOfferersByItemId.get(data.itemId);
    if (!ids || ids.size === 0) return employeesAll;
    return employeesAll.filter((e) => ids.has(e.id));
  }, [employeesAll, data.itemId, serviceOfferersByItemId]);

  const employeesDisplayOrder = useMemo(() => {
    if (!data.itemId.trim()) return employees;
    return [...employees].sort((a, b) =>
      employeeNearestSortKey(a.id, employeesNearestMap, loadingEmployeesNearest).localeCompare(
        employeeNearestSortKey(b.id, employeesNearestMap, loadingEmployeesNearest)
      )
    );
  }, [employees, data.itemId, employeesNearestMap, loadingEmployeesNearest]);

  const branchStepServiceOptions = useMemo(() => {
    if (branchPickerFromBranchPayload.options.length > 0) {
      return branchPickerFromBranchPayload.options;
    }
    return aggregatedBranchServices?.options ?? [];
  }, [branchPickerFromBranchPayload, aggregatedBranchServices]);

  const branchStepServiceCategories = useMemo(
    () =>
      buildReservationServiceStepCategories(branchStepServiceOptions, t('serviceCategoryOther')),
    [branchStepServiceOptions, t]
  );

  useEffect(() => {
    if (!apiToken || !data.branchId?.trim() || !data.itemId?.trim()) {
      setEmployeesNearestMap(null);
      setLoadingEmployeesNearest(false);
      return;
    }
    let cancelled = false;
    setEmployeesNearestMap(null);
    setLoadingEmployeesNearest(true);
    getEmployeesNearest(apiToken, {
      branchId: data.branchId.trim(),
      itemId: data.itemId.trim(),
      maxDays: 30,
    })
      .then((res) => {
        if (cancelled) return;
        const map = new Map<string, { price: number; nextSlot: EmployeesNearestNextSlot | null }>();
        for (const row of res.employees ?? []) {
          const id = row.employee?.id;
          if (!id) continue;
          map.set(id, { price: row.price, nextSlot: row.nextSlot });
        }
        setEmployeesNearestMap(map);
      })
      .catch(() => {
        if (!cancelled) setEmployeesNearestMap(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployeesNearest(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken, data.branchId, data.itemId]);

  useEffect(() => {
    nearestCalendarEmployeeRef.current = null;
  }, [data.branchId, data.itemId]);

  useEffect(() => {
    if (!data.employeeId || loadingEmployeesNearest || employeesNearestMap === null) return;
    if (nearestCalendarEmployeeRef.current === data.employeeId) return;
    applyNearestCalendarForEmployee(data.employeeId);
  }, [
    data.employeeId,
    employeesNearestMap,
    loadingEmployeesNearest,
    applyNearestCalendarForEmployee,
  ]);

  useEffect(() => {
    if (!apiToken || !data.employeeId) {
      setEmployeeServices([]);
      return;
    }
    getEmployeeById(apiToken, data.employeeId)
      .then((emp) => {
        setEmployeeServices(getEmployeeServicesList(emp.services));
      })
      .catch(() => setEmployeeServices([]));
  }, [apiToken, data.employeeId]);

  useEffect(() => {
    if (!data.itemId || !data.employeeId) return;
    const match = employeeServices.find((s) => s.id === data.itemId);
    if (match == null || typeof match.duration !== 'number') return;
    setData((prev) =>
      prev.duration === match.duration ? prev : { ...prev, duration: match.duration }
    );
  }, [employeeServices, data.itemId, data.employeeId, setData]);

  const selectedEmployee = useMemo(() => {
    const fromList = employeesAll.find((e) => e.id === data.employeeId);
    if (fromList) return fromList;
    const full = data.employeeId ? employeesById[data.employeeId] : undefined;
    if (full) {
      return mergeEmployee(
        { id: full.id, name: full.name, isActive: true } as BranchEmployee,
        full
      );
    }
    return null;
  }, [employeesAll, data.employeeId, employeesById]);

  const selectedService = useMemo((): ServiceOption | null => {
    const empSvc = employeeServices.find((s) => s.id === data.itemId);
    if (empSvc) {
      return serviceOptionFromEmployeeService(empSvc);
    }
    if (!branchForServiceStep || !data.itemId) return null;
    return findServiceOptionOnBranch(branchForServiceStep, data.itemId);
  }, [employeeServices, branchForServiceStep, data.itemId]);

  return {
    branchServicesSource,
    loadingBranchServicesFetch,
    loadingAggregatedBranchServices,
    branchesForReservation,
    branchStepServiceOptions,
    branchStepServiceCategories,
    employeesAll,
    employees,
    employeesDisplayOrder,
    employeesNearestMap,
    loadingEmployeesNearest,
    branchForServiceStep,
    selectedBranch,
    selectedEmployee,
    selectedService,
    selectBranchId,
    selectEmployee,
    selectServiceOption,
  };
}
