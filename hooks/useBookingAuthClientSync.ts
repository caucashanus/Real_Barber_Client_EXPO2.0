import { useCallback, useEffect, useRef } from 'react';

import type { CrmClient } from '@/api/auth';
import type { BookingStepKind } from '@/lib/booking/engine/types';
import { syncAuthClientFromApi } from '@/lib/booking/syncAuthClientFromApi';

/**
 * Booking submit používá kontakt z AuthContext (@crm_client), ne z edit-profile formuláře.
 * Jednou při vstupu do flow + znovu na shrnutí, pokud kontakt stále chybí.
 */
export function useBookingAuthClientSync(params: {
  apiToken: string | null;
  token: string | null;
  client: CrmClient | null;
  setAuth: (token: string, apiToken: string, client: CrmClient) => Promise<void>;
  step: BookingStepKind;
  bookingContactReady: boolean;
}): void {
  const { apiToken, token, client, setAuth, step, bookingContactReady } = params;
  const inflightRef = useRef(false);
  const didMountSyncRef = useRef(false);

  const runSync = useCallback(async () => {
    if (!apiToken || !token || !client || inflightRef.current) return;
    inflightRef.current = true;
    try {
      await syncAuthClientFromApi({ apiToken, token, currentClient: client, setAuth });
    } catch {
      // offline / 401 — submit zůstane blokovaný nebo AuthGuard odhlásí
    } finally {
      inflightRef.current = false;
    }
  }, [apiToken, token, client, setAuth]);

  useEffect(() => {
    if (didMountSyncRef.current) return;
    didMountSyncRef.current = true;
    void runSync();
  }, [runSync]);

  useEffect(() => {
    if (step !== 'summary' || bookingContactReady) return;
    void runSync();
  }, [step, bookingContactReady, runSync]);
}
