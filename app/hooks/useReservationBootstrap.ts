import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import type {
  ReservationFlowDataState,
  ReservationMonthState,
} from './reservationCreateFlowShared';

import { getBranches, type Branch } from '@/api/branches';
import { getEmployeeById, getEmployees, type Employee } from '@/api/employees';
import {
  type BarberEntryMode,
  findServiceOptionOnBranch,
  getEmployeeBranchesList,
  trimParam,
} from '@/utils/reservationCreateHelpers';

interface UseReservationBootstrapParams extends ReservationFlowDataState, ReservationMonthState {
  apiToken: string | null;
}

export function useReservationBootstrap({
  apiToken,
  setData,
  setLastSelectedDateByMonth,
  setMonthOffset,
}: UseReservationBootstrapParams) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employeesById, setEmployeesById] = useState<Record<string, Employee>>({});
  const [loadingBranches, setLoadingBranches] = useState(true);
  const params = useLocalSearchParams<{
    employeeId?: string;
    branchId?: string;
    itemId?: string;
    itemName?: string;
  }>();
  const presetEmployeeId = trimParam(params.employeeId);
  const presetBranchId = trimParam(params.branchId);
  const presetItemId = trimParam(params.itemId);
  const presetItemName = trimParam(params.itemName);

  const [barberEntryMode, setBarberEntryMode] = useState<BarberEntryMode>('none');
  const [barberBootstrap, setBarberBootstrap] = useState<'pending' | 'ready' | 'error'>(() =>
    presetEmployeeId || presetBranchId || presetItemId ? 'pending' : 'ready'
  );
  const [initialMultiStepIndex, setInitialMultiStepIndex] = useState(0);
  const [presetBranchFilterIds, setPresetBranchFilterIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setLoadingBranches(false);
      return;
    }
    setLoadingBranches(true);
    Promise.all([
      getBranches(apiToken),
      getEmployees(apiToken, { includeReviews: true, reviewsLimit: 99 }).catch(
        () => [] as Employee[]
      ),
    ])
      .then(([list, employees]) => {
        setBranches(list);
        const map: Record<string, Employee> = {};
        employees.forEach((emp) => {
          if (emp.id) map[emp.id] = emp;
        });
        setEmployeesById(map);
      })
      .catch(() => {
        setBranches([]);
        setEmployeesById({});
      })
      .finally(() => setLoadingBranches(false));
  }, [apiToken]);

  useEffect(() => {
    const hasDeepLink = Boolean(presetEmployeeId || presetBranchId || presetItemId);
    if (!hasDeepLink) {
      setBarberBootstrap('ready');
      setBarberEntryMode('none');
      setPresetBranchFilterIds(null);
      setInitialMultiStepIndex(0);
      return;
    }
    if (!apiToken) {
      setBarberBootstrap('error');
      return;
    }
    if (loadingBranches) return;

    if (presetEmployeeId && presetBranchId && presetItemId) {
      const branch = branches.find((b) => b.id === presetBranchId) ?? null;
      if (!branch) {
        setData((prev) => ({
          ...prev,
          branchId: '',
          employeeId: '',
          itemId: '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        }));
        setLastSelectedDateByMonth({});
        setMonthOffset(0);
        setBarberEntryMode('none');
        setInitialMultiStepIndex(0);
        setPresetBranchFilterIds(null);
        setBarberBootstrap('ready');
        return;
      }

      const svc = findServiceOptionOnBranch(branch, presetItemId);
      const duration = svc?.duration ?? 0;
      setData((prev) => ({
        ...prev,
        branchId: presetBranchId,
        employeeId: presetEmployeeId,
        itemId: presetItemId,
        date: '',
        slotStart: '',
        slotEnd: '',
        duration,
      }));
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
      setBarberEntryMode('single');
      setInitialMultiStepIndex(3);
      setPresetBranchFilterIds(null);
      setBarberBootstrap('ready');
      return;
    }

    if (presetEmployeeId) {
      let cancelled = false;
      setBarberBootstrap('pending');
      getEmployeeById(apiToken, presetEmployeeId)
        .then((emp) => {
          if (cancelled) return;
          const eb = getEmployeeBranchesList(emp);
          const ids = new Set(eb.map((b) => b.id).filter((id) => typeof id === 'string' && id));
          const matched = branches.filter((b) => ids.has(b.id));
          if (matched.length === 1) {
            setData((prev) => ({
              ...prev,
              branchId: matched[0].id,
              employeeId: presetEmployeeId,
              itemId: '',
              date: '',
              slotStart: '',
              slotEnd: '',
              duration: 0,
            }));
            setLastSelectedDateByMonth({});
            setMonthOffset(0);
            setBarberEntryMode('single');
            setInitialMultiStepIndex(1);
            setPresetBranchFilterIds(null);
            setBarberBootstrap('ready');
          } else if (matched.length > 1) {
            setData((prev) => ({
              ...prev,
              branchId: '',
              employeeId: presetEmployeeId,
              itemId: '',
              date: '',
              slotStart: '',
              slotEnd: '',
              duration: 0,
            }));
            setLastSelectedDateByMonth({});
            setMonthOffset(0);
            setBarberEntryMode('multi');
            setInitialMultiStepIndex(0);
            setPresetBranchFilterIds(ids);
            setBarberBootstrap('ready');
          } else {
            setBarberEntryMode('none');
            setBarberBootstrap('error');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBarberEntryMode('none');
            setBarberBootstrap('error');
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (presetBranchId) {
      const exists = branches.some((b) => b.id === presetBranchId);
      if (!exists) {
        setData((prev) => ({
          ...prev,
          branchId: '',
          employeeId: '',
          itemId: '',
          date: '',
          slotStart: '',
          slotEnd: '',
          duration: 0,
        }));
        setLastSelectedDateByMonth({});
        setMonthOffset(0);
        setBarberEntryMode('none');
        setInitialMultiStepIndex(0);
        setPresetBranchFilterIds(null);
        setBarberBootstrap('ready');
        return;
      }
      setData((prev) => ({
        ...prev,
        branchId: presetBranchId,
        employeeId: '',
        itemId: '',
        date: '',
        slotStart: '',
        slotEnd: '',
        duration: 0,
      }));
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
      setBarberEntryMode('branch');
      setInitialMultiStepIndex(1);
      setPresetBranchFilterIds(null);
      setBarberBootstrap('ready');
      return;
    }

    if (presetItemId) {
      let duration = 0;
      for (const b of branches) {
        const svc = findServiceOptionOnBranch(b, presetItemId);
        if (svc) {
          duration = svc.duration;
          break;
        }
      }
      setData((prev) => ({
        ...prev,
        branchId: '',
        employeeId: '',
        itemId: presetItemId,
        date: '',
        slotStart: '',
        slotEnd: '',
        duration,
      }));
      setLastSelectedDateByMonth({});
      setMonthOffset(0);
      setBarberEntryMode('service');
      setInitialMultiStepIndex(0);
      setPresetBranchFilterIds(null);
      setBarberBootstrap('ready');
    }
  }, [
    presetEmployeeId,
    presetBranchId,
    presetItemId,
    apiToken,
    loadingBranches,
    branches,
    setData,
    setLastSelectedDateByMonth,
    setMonthOffset,
  ]);

  return {
    presetEmployeeId,
    presetBranchId,
    presetItemId,
    presetItemName,
    barberEntryMode,
    barberBootstrap,
    initialMultiStepIndex,
    presetBranchFilterIds,
    branches,
    employeesById,
    loadingBranches,
  };
}
