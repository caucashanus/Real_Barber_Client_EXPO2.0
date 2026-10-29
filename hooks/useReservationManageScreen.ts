import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getClientBookingById, type Booking } from '@/api/bookings';
import {
  cancelPublicManagedReservation,
  confirmPublicManagedReservation,
  fetchPublicManagedReservation,
} from '@/api/publicReservationManage';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { bookingFromManagedReservation } from '@/utils/bookingFromManagedReservation';
import {
  persistManageSecret,
  readManageSecret,
} from '@/utils/reservationManageSecretStorage';
import type { PublicManagedReservation } from '@/utils/reservationManageParse';

export type ReservationManageLoadError =
  | 'missing_token'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'unknown'
  | null;

export function useReservationManageScreen(params: { id: string; key?: string }) {
  const reservationId = params.id?.trim() ?? '';
  const { apiToken, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [secretReady, setSecretReady] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [ownerCheckDone, setOwnerCheckDone] = useState(false);
  const [redirectingToAccount, setRedirectingToAccount] = useState(false);
  const [reservation, setReservation] = useState<PublicManagedReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ReservationManageLoadError>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initSecret = async () => {
      const keyFromUrl = params.key?.trim();
      if (keyFromUrl) {
        await persistManageSecret(reservationId, keyFromUrl);
        if (!cancelled) {
          setSecret(keyFromUrl);
          router.replace(`/screens/reservation-manage?id=${encodeURIComponent(reservationId)}`);
        }
      } else {
        const stored = await readManageSecret(reservationId);
        if (!cancelled) setSecret(stored);
      }
      if (!cancelled) setSecretReady(true);
    };
    void initSecret();
    return () => {
      cancelled = true;
    };
  }, [params.key, reservationId]);

  useEffect(() => {
    if (authLoading || !reservationId) {
      return;
    }
    if (!apiToken) {
      setOwnerCheckDone(true);
      return;
    }
    let cancelled = false;
    const tryAccount = async () => {
      try {
        const booking = await getClientBookingById(apiToken, reservationId);
        if (cancelled) return;
        if (booking) {
          setRedirectingToAccount(true);
          router.replace(`/screens/booking-detail?id=${encodeURIComponent(reservationId)}`);
          return;
        }
      } catch {
        // guest manage fallback
      }
      if (!cancelled) setOwnerCheckDone(true);
    };
    void tryAccount();
    return () => {
      cancelled = true;
    };
  }, [apiToken, authLoading, reservationId]);

  const loadReservation = useCallback(async (token: string) => {
    setLoading(true);
    setLoadError(null);
    const res = await fetchPublicManagedReservation(reservationId, token);
    setLoading(false);
    if (!res.ok) {
      if (res.error === 'forbidden') setLoadError('forbidden');
      else if (res.error === 'not_found') setLoadError('not_found');
      else if (res.error === 'rate_limit') setLoadError('rate_limit');
      else setLoadError('unknown');
      setReservation(null);
      return;
    }
    setReservation(res.reservation);
  }, [reservationId]);

  useEffect(() => {
    if (!secretReady || redirectingToAccount || !ownerCheckDone) return;
    if (!secret) {
      setLoading(false);
      setLoadError('missing_token');
      return;
    }
    void loadReservation(secret);
  }, [secretReady, secret, loadReservation, redirectingToAccount, ownerCheckDone]);

  const booking: Booking | null = useMemo(
    () => (reservation ? bookingFromManagedReservation(reservation) : null),
    [reservation]
  );

  const onConfirm = useCallback(async () => {
    if (!secret || !reservation) return;
    setConfirming(true);
    setConfirmError(null);
    const res = await confirmPublicManagedReservation(reservation.id, secret);
    setConfirming(false);
    if (!res.ok) {
      setConfirmError(res.message ?? t('bookingDetailConfirmError'));
      return;
    }
    setReservation(res.reservation);
  }, [reservation, secret, t]);

  const onCancel = useCallback(
    async (reason?: string) => {
      if (!secret || !reservation) return;
      setCancelling(true);
      setCancelError(null);
      const res = await cancelPublicManagedReservation(reservation.id, secret, reason);
      setCancelling(false);
      if (!res.ok) {
        setCancelError(res.message ?? t('bookingDetailCancelError'));
        return;
      }
      setReservation(res.reservation);
    },
    [reservation, secret, t]
  );

  const showBrandedLoading =
    redirectingToAccount ||
    authLoading ||
    (apiToken && !ownerCheckDone) ||
    !secretReady ||
    loading;

  return {
    reservationId,
    booking,
    reservation,
    showBrandedLoading,
    loadError,
    confirming,
    confirmError,
    cancelling,
    cancelError,
    onConfirm,
    onCancel,
    reload: secret ? () => loadReservation(secret) : undefined,
  };
}
