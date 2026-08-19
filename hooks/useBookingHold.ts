import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createBookingHold,
  extendBookingHold,
  releaseBookingHold,
  type BookingHoldCreateBody,
} from '@/api/bookingEngine';
import { isBookingSlotConflict } from '@/lib/booking/booking-api/errors';
import { invalidateListingAvailability } from '@/lib/availability/listingCache';
import { formatHoldCountdownMs, holdRemainingMs } from '@/lib/booking/hold/formatCountdown';
import {
  clearBookingHoldStorage,
  readBookingHoldStorage,
  writeBookingHoldStorage,
} from '@/lib/booking/hold/storage';
import type {
  BookingHoldCreateResult,
  BookingHoldDialogKind,
  BookingHoldState,
} from '@/lib/booking/hold/types';

type HoldOperation = 'create' | 'extend' | 'release';

function mapApiHoldToState(hold: {
  holdId: string;
  expiresAt: string;
  branchId: string;
  itemId: string;
  employeeId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
}): BookingHoldState {
  return {
    holdId: hold.holdId,
    expiresAt: hold.expiresAt,
    branchId: hold.branchId,
    itemId: hold.itemId,
    employeeId: hold.employeeId,
    date: hold.date,
    slotStart: hold.slotStart,
    slotEnd: hold.slotEnd,
  };
}

export function useBookingHold(apiToken?: string | null) {
  const [hold, setHold] = useState<BookingHoldState | null>(null);
  const [isCreatingHold, setIsCreatingHold] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [dialogKind, setDialogKind] = useState<BookingHoldDialogKind | null>(null);
  const [countdownTick, setCountdownTick] = useState(0);

  const holdRef = useRef<BookingHoldState | null>(null);
  const inflightRef = useRef<HoldOperation | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extendOnceRef = useRef(false);

  const syncHold = useCallback((next: BookingHoldState | null) => {
    holdRef.current = next;
    setHold(next);
  }, []);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const scheduleExpiry = useCallback(
    (expiresAt: string) => {
      clearExpiryTimer();
      const remaining = holdRemainingMs(expiresAt);
      if (remaining <= 0) {
        setDialogKind('expired');
        syncHold(null);
        void clearBookingHoldStorage();
        return;
      }
      expiryTimerRef.current = setTimeout(() => {
        const current = holdRef.current;
        if (current?.holdId) {
          void releaseBookingHold(current.holdId, apiToken).catch(() => {});
        }
        syncHold(null);
        void clearBookingHoldStorage();
        setDialogKind('expired');
      }, remaining + 50);
    },
    [apiToken, clearExpiryTimer, syncHold]
  );

  const clearHoldLocal = useCallback(async () => {
    clearExpiryTimer();
    syncHold(null);
    extendOnceRef.current = false;
    await clearBookingHoldStorage();
  }, [clearExpiryTimer, syncHold]);

  const runInflight = useCallback(
    async <T>(operation: HoldOperation, fn: () => Promise<T>): Promise<T | null> => {
      if (inflightRef.current) return null;
      inflightRef.current = operation;
      try {
        return await fn();
      } finally {
        inflightRef.current = null;
      }
    },
    []
  );

  const persistHold = useCallback(
    async (state: BookingHoldState) => {
      syncHold(state);
      await writeBookingHoldStorage(state);
      scheduleExpiry(state.expiresAt);
    },
    [scheduleExpiry, syncHold]
  );

  const releaseHoldBestEffort = useCallback(async () => {
    const current = holdRef.current;
    if (current?.holdId) {
      invalidateListingAvailability({
        employeeId: current.employeeId,
        branchId: current.branchId,
        serviceId: current.itemId,
      });
    }
    if (!current?.holdId) {
      await clearHoldLocal();
      return;
    }
    await runInflight('release', async () => {
      try {
        await releaseBookingHold(current.holdId, apiToken);
      } catch {
        // best-effort
      }
      await clearHoldLocal();
    });
  }, [apiToken, clearHoldLocal, runInflight]);

  const createHold = useCallback(
    async (body: BookingHoldCreateBody): Promise<BookingHoldCreateResult> => {
      setCreateError(null);
      setIsCreatingHold(true);
      try {
        const result = await runInflight('create', async () => {
          const existing = holdRef.current;
          if (existing?.holdId) {
            try {
              await releaseBookingHold(existing.holdId, apiToken);
            } catch {
              // continue with replace
            }
            await clearBookingHoldStorage();
            syncHold(null);
          }

          const response = await createBookingHold(body, apiToken);
          const next = mapApiHoldToState(response.hold);
          await persistHold(next);
          invalidateListingAvailability({
            employeeId: next.employeeId,
            branchId: next.branchId,
            serviceId: next.itemId,
          });
          extendOnceRef.current = false;
          return 'ok' as const;
        });

        if (result === null) return 'error';
        return result;
      } catch (err) {
        if (isBookingSlotConflict(err)) {
          setDialogKind('unavailable');
          await clearHoldLocal();
          return 'conflict';
        }
        setCreateError(err instanceof Error ? err.message : 'hold failed');
        return 'error';
      } finally {
        setIsCreatingHold(false);
      }
    },
    [apiToken, clearHoldLocal, persistHold, runInflight, syncHold]
  );

  const extendOnce = useCallback(async () => {
    if (extendOnceRef.current) return;
    const current = holdRef.current;
    if (!current?.holdId) return;
    extendOnceRef.current = true;

    await runInflight('extend', async () => {
      try {
        const response = await extendBookingHold(current.holdId, apiToken);
        const next = mapApiHoldToState(response.hold);
        await persistHold(next);
      } catch {
        // extend is best-effort; countdown still uses local expiresAt
      }
    });
  }, [apiToken, persistHold, runInflight]);

  const dismissDialog = useCallback(() => {
    setDialogKind(null);
  }, []);

  const showUnavailableDialog = useCallback(() => {
    setDialogKind('unavailable');
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await readBookingHoldStorage();
      if (cancelled || !stored) return;
      await persistHold(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [persistHold]);

  useEffect(() => {
    if (!hold?.expiresAt) return;
    const id = setInterval(() => setCountdownTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hold?.expiresAt]);

  useEffect(() => () => clearExpiryTimer(), [clearExpiryTimer]);

  const countdownMs = hold?.expiresAt ? holdRemainingMs(hold.expiresAt) : 0;
  void countdownTick;

  const countdownLabel = formatHoldCountdownMs(countdownMs);

  return {
    hold,
    holdId: hold?.holdId ?? null,
    isCreatingHold,
    createError,
    dialogKind,
    countdownLabel,
    countdownMs,
    createHold,
    extendOnce,
    releaseHoldBestEffort,
    clearHoldLocal,
    dismissDialog,
    showUnavailableDialog,
    resetExtendOnce: () => {
      extendOnceRef.current = false;
    },
  };
}

export type BookingHoldController = ReturnType<typeof useBookingHold>;
