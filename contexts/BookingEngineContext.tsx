import { useLocalSearchParams } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { BookingEntity, BookingService, BookingSlot } from '@/lib/booking/constants';
import {
  buildBookingDraftSnapshot,
  clearBookingDraft,
  readBookingDraft,
  restoreSelectionsFromDraft,
  saveBookingDraft,
  shouldRestoreBookingDraft,
} from '@/lib/booking/engine/bookingDraft';
import { resolvePresetFromRouteParams } from '@/lib/booking/engine/resolvePresetFromParams';
import {
  bookingSelectionsReducer,
  EMPTY_BOOKING_SELECTIONS_STATE,
  type BookingSelectionsAction,
  type BookingSelectionsState,
} from '@/lib/booking/engine/bookingSelectionsReducer';
import type { BookingSelections, BookingStepKind } from '@/lib/booking/engine/types';
import {
  computeMaxAllowedStep,
  isStepSatisfiedForKind,
} from '@/lib/booking/engine/navigation/cleanup';
import { getRecipe } from '@/lib/booking/engine/recipes';
import { resolveActiveSteps } from '@/lib/booking/engine/resolveActiveSteps';

type BookingEngineContextValue = {
  recipeId: ReturnType<typeof resolvePresetFromRouteParams>['recipeId'];
  preset: ReturnType<typeof resolvePresetFromRouteParams>['preset'];
  selections: BookingSelectionsState;
  dispatch: React.Dispatch<BookingSelectionsAction>;
  setBranch: (branch: BookingEntity | null, options?: { clearDownstream?: boolean }) => void;
  setService: (service: BookingService | null, options?: { clearDownstream?: boolean }) => void;
  setEmployee: (employee: BookingEntity | null, options?: { clearDownstream?: boolean }) => void;
  setDate: (date: string | null, options?: { clearSlot?: boolean }) => void;
  setSlot: (slot: BookingSlot | null) => void;
  patchSelections: (
    patch: (state: BookingSelectionsState) => Partial<BookingSelectionsState>
  ) => void;
  resetSelections: () => void;
  toBookingSelections: () => BookingSelections;
  stepIndex: number;
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
  draftReady: boolean;
  clearDraft: () => Promise<void>;
};

const BookingEngineContext = createContext<BookingEngineContextValue | null>(null);

function trimSearchParam(value: string | string[] | undefined | null): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function BookingEngineProvider({ children }: { children: React.ReactNode }) {
  const params = useLocalSearchParams();
  const routeParams = useMemo(
    () => ({
      recipe: trimSearchParam(params.recipe),
      branchId: trimSearchParam(params.branchId),
      employeeId: trimSearchParam(params.employeeId),
      itemId: trimSearchParam(params.itemId),
      branchSlug: trimSearchParam(params.branchSlug),
      employeeSlug: trimSearchParam(params.employeeSlug),
      serviceSlug: trimSearchParam(params.serviceSlug),
    }),
    [params]
  );

  const { recipeId, preset } = useMemo(
    () => resolvePresetFromRouteParams(routeParams),
    [routeParams]
  );

  const [selections, dispatch] = useReducer(
    bookingSelectionsReducer,
    EMPTY_BOOKING_SELECTIONS_STATE
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipDraftSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = await readBookingDraft();
      if (cancelled) return;
      if (
        draft &&
        shouldRestoreBookingDraft({
          draft,
          recipeId,
          presetBranchId: preset.branchId,
          presetServiceId: preset.serviceId,
          presetEmployeeId: preset.employeeId,
        })
      ) {
        const restored = restoreSelectionsFromDraft(draft);
        dispatch({ type: 'RESTORE', payload: restored });
        const recipe = getRecipe(recipeId);
        const activeSteps = resolveActiveSteps(recipe, preset, {
          skipContact: false,
          skipDatetime: false,
        });
        const maxAllowed = computeMaxAllowedStep(activeSteps, {
          branch: restored.branch ? { id: restored.branch.id, name: restored.branch.name } : null,
          service: restored.service ? { id: restored.service.id, name: restored.service.name } : null,
          employee: restored.employee ? { id: restored.employee.id, name: restored.employee.name } : null,
          date: restored.date ?? null,
          slot: restored.slot ?? null,
        });
        const maxIdx = Math.max(0, activeSteps.indexOf(maxAllowed));
        setStepIndex(Math.min(restored.stepIndex, maxIdx));
      }
      skipDraftSaveRef.current = false;
      setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId, preset.branchId, preset.serviceId, preset.employeeId]);

  useEffect(() => {
    if (!draftReady || skipDraftSaveRef.current) return;
    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      void saveBookingDraft(buildBookingDraftSnapshot(recipeId, selections, stepIndex));
    }, 400);
    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
  }, [draftReady, recipeId, selections, stepIndex]);

  const setBranch = useCallback(
    (branch: BookingEntity | null, options?: { clearDownstream?: boolean }) => {
      dispatch({ type: 'SET_BRANCH', branch, clearDownstream: options?.clearDownstream });
    },
    []
  );

  const setService = useCallback(
    (service: BookingService | null, options?: { clearDownstream?: boolean }) => {
      dispatch({ type: 'SET_SERVICE', service, clearDownstream: options?.clearDownstream });
    },
    []
  );

  const setEmployee = useCallback(
    (employee: BookingEntity | null, options?: { clearDownstream?: boolean }) => {
      dispatch({ type: 'SET_EMPLOYEE', employee, clearDownstream: options?.clearDownstream });
    },
    []
  );

  const setDate = useCallback((date: string | null, options?: { clearSlot?: boolean }) => {
    dispatch({ type: 'SET_DATE', date, clearSlot: options?.clearSlot });
  }, []);

  const setSlot = useCallback((slot: BookingSlot | null) => {
    dispatch({ type: 'SET_SLOT', slot });
  }, []);

  const patchSelections = useCallback(
    (patch: (state: BookingSelectionsState) => Partial<BookingSelectionsState>) => {
      dispatch({ type: 'PATCH', patch });
    },
    []
  );

  const resetSelections = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const toBookingSelections = useCallback((): BookingSelections => {
    return {
      branch: selections.branch
        ? { id: selections.branch.id, name: selections.branch.name ?? selections.branch.displayName }
        : null,
      service: selections.service
        ? { id: selections.service.id, name: selections.service.name }
        : null,
      employee: selections.employee
        ? { id: selections.employee.id, name: selections.employee.name ?? selections.employee.displayName }
        : null,
      date: selections.date,
      slot: selections.slot,
    };
  }, [selections]);

  const clearDraft = useCallback(async () => {
    skipDraftSaveRef.current = true;
    await clearBookingDraft();
    skipDraftSaveRef.current = false;
  }, []);

  const value = useMemo(
    (): BookingEngineContextValue => ({
      recipeId,
      preset,
      selections,
      dispatch,
      setBranch,
      setService,
      setEmployee,
      setDate,
      setSlot,
      patchSelections,
      resetSelections,
      toBookingSelections,
      stepIndex,
      setStepIndex,
      draftReady,
      clearDraft,
    }),
    [
      recipeId,
      preset,
      selections,
      setBranch,
      setService,
      setEmployee,
      setDate,
      setSlot,
      patchSelections,
      resetSelections,
      toBookingSelections,
      stepIndex,
      draftReady,
      clearDraft,
    ]
  );

  return <BookingEngineContext.Provider value={value}>{children}</BookingEngineContext.Provider>;
}

export function useBookingEngineContext(): BookingEngineContextValue {
  const ctx = useContext(BookingEngineContext);
  if (!ctx) {
    throw new Error('useBookingEngineContext must be used within BookingEngineProvider');
  }
  return ctx;
}

export function useBookingEngineSelections() {
  const ctx = useBookingEngineContext();
  return {
    selections: ctx.selections,
    dispatch: ctx.dispatch,
    setBranch: ctx.setBranch,
    setService: ctx.setService,
    setEmployee: ctx.setEmployee,
    setDate: ctx.setDate,
    setSlot: ctx.setSlot,
    patchSelections: ctx.patchSelections,
    resetSelections: ctx.resetSelections,
    toBookingSelections: ctx.toBookingSelections,
    selectedBranch: ctx.selections.branch,
    selectedService: ctx.selections.service,
    selectedEmployee: ctx.selections.employee,
    selectedDate: ctx.selections.date,
    selectedSlot: ctx.selections.slot,
  };
}

export function useBookingEngineNavigation(activeSteps: readonly BookingStepKind[]) {
  const ctx = useBookingEngineContext();
  const selections = ctx.toBookingSelections();

  useEffect(() => {
    if (ctx.stepIndex >= activeSteps.length) {
      ctx.setStepIndex(Math.max(0, activeSteps.length - 1));
    }
  }, [activeSteps.length, ctx.stepIndex, ctx.setStepIndex, activeSteps]);

  const step = activeSteps[ctx.stepIndex] ?? activeSteps[0] ?? 'branch';

  const goToStepIndex = useCallback(
    (nextIndex: number, options?: { fromStep?: BookingStepKind; clearContactOtp?: () => void; awaitingOtp?: boolean }) => {
      const clamped = Math.max(0, Math.min(nextIndex, activeSteps.length - 1));
      const fromStep = options?.fromStep ?? activeSteps[ctx.stepIndex] ?? step;
      const toStep = activeSteps[clamped] ?? step;
      if (clamped < ctx.stepIndex) {
        if (
          options?.awaitingOtp &&
          (fromStep === 'contact' ||
            fromStep === 'summary' ||
            fromStep === 'datetime' ||
            toStep === 'datetime')
        ) {
          options.clearContactOtp?.();
        }
        ctx.dispatch({
          type: 'BACKWARD_CLEANUP',
          fromStep,
          toStep,
          activeSteps,
        });
      }
      ctx.setStepIndex(clamped);
    },
    [activeSteps, ctx, step]
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
    (index: number, reason: 'next' | 'back' | 'skip', options?: { clearContactOtp?: () => void; awaitingOtp?: boolean }) => {
      if (reason === 'back') {
        goToStepIndex(index, options);
        return;
      }
      const maxAllowed = computeMaxAllowedStep(activeSteps, selections);
      const maxIdx = activeSteps.indexOf(maxAllowed);
      if (index > maxIdx) {
        goToStepIndex(maxIdx, options);
        return;
      }
      ctx.setStepIndex(index);
    },
    [activeSteps, selections, goToStepIndex, ctx]
  );

  const goToStepByKind = useCallback(
    (kind: BookingStepKind) => {
      const targetIdx = activeSteps.indexOf(kind);
      if (targetIdx === -1 || targetIdx >= ctx.stepIndex) return;
      goToStepIndex(targetIdx);
    },
    [activeSteps, ctx.stepIndex, goToStepIndex]
  );

  return {
    stepIndex: ctx.stepIndex,
    setStepIndex: ctx.setStepIndex,
    step,
    goToStepIndex,
    goToStepByKind,
    isNextDisabled,
    onStepIndexChange,
  };
}
