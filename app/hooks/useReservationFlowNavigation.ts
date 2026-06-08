import { useCallback } from 'react';

import type {
  ReservationFlowDataState,
  ReservationMonthState,
} from './reservationCreateFlowShared';

import type { Branch } from '@/api/branches';
import {
  findServiceOptionOnBranch,
  type BarberEntryMode,
  type ReservationFlowData,
} from '@/utils/reservationCreateHelpers';

interface UseReservationFlowNavigationParams
  extends ReservationFlowDataState,
    ReservationMonthState {
  branches: Branch[];
  branchServicesSource: Branch | null;
  presetEmployeeId: string | undefined;
  presetBranchId: string | undefined;
  presetItemId: string | undefined;
  barberEntryMode: BarberEntryMode;
  initialMultiStepIndex: number;
}

export function useReservationFlowNavigation({
  data,
  setData,
  setMonthOffset,
  setLastSelectedDateByMonth,
  branches,
  branchServicesSource,
  presetEmployeeId,
  presetBranchId,
  presetItemId,
  barberEntryMode,
  initialMultiStepIndex,
}: UseReservationFlowNavigationParams) {
  const resetFlowAfterStep = useCallback(
    (stepIndex: number) => {
      const durationForItem = (prev: ReservationFlowData) => {
        if (!prev.itemId || !prev.branchId) return 0;
        const fromFetched =
          branchServicesSource?.id === prev.branchId ? branchServicesSource : null;
        const b = fromFetched ?? branches.find((x) => x.id === prev.branchId) ?? null;
        const svc = b ? findServiceOptionOnBranch(b, prev.itemId) : null;
        return svc?.duration ?? 0;
      };
      setData((prev) => {
        if (stepIndex < 1) {
          return {
            ...prev,
            employeeId: presetEmployeeId ? presetEmployeeId : '',
            itemId: presetItemId ? presetItemId : '',
            date: '',
            slotStart: '',
            slotEnd: '',
            duration: presetItemId ? prev.duration : 0,
          };
        }
        if (stepIndex < 2) {
          if (presetItemId) {
            return {
              ...prev,
              employeeId: presetEmployeeId ? presetEmployeeId : '',
              date: '',
              slotStart: '',
              slotEnd: '',
              duration: prev.duration,
            };
          }
          return {
            ...prev,
            employeeId: presetEmployeeId ? presetEmployeeId : '',
            date: '',
            slotStart: '',
            slotEnd: '',
            duration: prev.itemId ? durationForItem(prev) : 0,
          };
        }
        if (stepIndex < 3) {
          return {
            ...prev,
            date: '',
            slotStart: '',
            slotEnd: '',
            duration: presetItemId ? prev.duration : durationForItem(prev),
          };
        }
        if (stepIndex < 4) {
          return {
            ...prev,
            slotStart: '',
            slotEnd: '',
            duration: presetItemId ? prev.duration : durationForItem(prev),
          };
        }
        return prev;
      });
      if (stepIndex < 3) {
        setLastSelectedDateByMonth({});
      }
      if (stepIndex < 1) {
        setMonthOffset(0);
      }
    },
    [
      presetEmployeeId,
      presetItemId,
      branches,
      branchServicesSource,
      setData,
      setLastSelectedDateByMonth,
      setMonthOffset,
    ]
  );

  const useFlowNextResolver =
    ((barberEntryMode === 'multi' || barberEntryMode === 'single') && Boolean(presetEmployeeId)) ||
    (barberEntryMode === 'service' && Boolean(presetItemId));
  const useFlowPrevResolver =
    Boolean(presetEmployeeId) || barberEntryMode === 'branch' || barberEntryMode === 'service';

  const flowStepNextIndex = useCallback(
    (currentStepIndex: number) => {
      if (barberEntryMode === 'service' && presetItemId && currentStepIndex === 0) return 2;
      if (
        (barberEntryMode === 'multi' || barberEntryMode === 'single') &&
        presetEmployeeId &&
        currentStepIndex === 1
      ) {
        return 3;
      }
      return currentStepIndex + 1;
    },
    [barberEntryMode, presetEmployeeId, presetItemId]
  );

  const flowStepPrevIndex = useCallback(
    (currentStepIndex: number) => {
      if (presetEmployeeId) {
        if (barberEntryMode === 'single' && currentStepIndex === 3) return 1;
        if (barberEntryMode === 'single' && currentStepIndex === 1) return -1;
        if (barberEntryMode === 'multi' && currentStepIndex === 3) return 1;
        return currentStepIndex - 1;
      }
      if (barberEntryMode === 'branch' && presetBranchId) {
        if (currentStepIndex === 1) return -1;
        return currentStepIndex - 1;
      }
      if (barberEntryMode === 'service' && presetItemId) {
        if (currentStepIndex === 3) return 2;
        if (currentStepIndex === 2) return 0;
        if (currentStepIndex === 0) return -1;
        return currentStepIndex - 1;
      }
      return currentStepIndex - 1;
    },
    [presetEmployeeId, presetBranchId, presetItemId, barberEntryMode]
  );

  const onStepIndexChange = useCallback(
    (idx: number, reason?: string) => {
      if (reason === 'back') {
        resetFlowAfterStep(idx);
      }
    },
    [resetFlowAfterStep]
  );

  const multiStepKey = `res-${presetEmployeeId ?? 'e'}-${presetBranchId ?? 'b'}-${presetItemId ?? 'i'}-${barberEntryMode}-${initialMultiStepIndex}`;

  return {
    useFlowNextResolver,
    useFlowPrevResolver,
    flowStepNextIndex,
    flowStepPrevIndex,
    onStepIndexChange,
    multiStepKey,
  };
}
