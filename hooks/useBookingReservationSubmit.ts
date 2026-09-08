import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createBookingApiReservation } from '@/api/bookingEngine';
import type { CrmClient } from '@/api/auth';
import type { TranslationKey } from '@/locales';
import { BookingApiError, isBookingRateLimited, isBookingSlotConflict } from '@/lib/booking/booking-api/errors';
import { mapAuthClientToBookingContact } from '@/lib/booking/authContact';
import { buildFullPhone, phoneCountrySelectValueFromIso2 } from '@/utils/phone';

export type BookingReservationSubmitContext = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type PrefillState = BookingReservationSubmitContext;

const EMPTY_PREFILL: PrefillState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

function prefillFromClient(client: CrmClient): PrefillState {
  const mapped = mapAuthClientToBookingContact(client);
  if (mapped) {
    return {
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      email: mapped.email,
      phone: mapped.phone,
    };
  }

  const nameParts = (client.name ?? '').trim().split(/\s+/).filter(Boolean);
  const phoneDigits = (client.phone ?? '').replace(/\D/g, '');
  const national =
    phoneDigits.startsWith('420') && phoneDigits.length >= 12
      ? phoneDigits.slice(3)
      : phoneDigits.replace(/^0+/, '');

  return {
    firstName: nameParts[0] ?? '',
    lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
    email: client.email?.trim() ?? '',
    phone: national
      ? buildFullPhone(phoneCountrySelectValueFromIso2('CZ'), national)
      : client.phone?.trim() || '',
  };
}

/**
 * Auth-only booking submit — app users are logged in; no guest Kontakt / OTP UI.
 */
export function useBookingReservationSubmit(
  client: CrmClient | null | undefined,
  apiToken: string | null
) {
  const [prefill, setPrefill] = useState<PrefillState>(EMPTY_PREFILL);
  const [authPrefillReady, setAuthPrefillReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submitLockRef = useRef(false);
  const submitSuccessRef = useRef(false);

  useEffect(() => {
    submitSuccessRef.current = submitSuccess;
  }, [submitSuccess]);

  useEffect(() => {
    if (!client) {
      setPrefill(EMPTY_PREFILL);
      setAuthPrefillReady(true);
      return;
    }
    setPrefill(prefillFromClient(client));
    setAuthPrefillReady(true);
  }, [client]);

  const contactContext = useMemo<BookingReservationSubmitContext>(
    () => ({
      firstName: prefill.firstName.trim(),
      lastName: prefill.lastName.trim(),
      email: prefill.email.trim(),
      phone: prefill.phone.trim(),
    }),
    [prefill]
  );

  const submitReservation = useCallback(
    async (params: {
      buildPayload: (ctx: BookingReservationSubmitContext) => Record<string, unknown> | null;
      onSuccess?: (data: unknown) => void;
      onSlotConflict?: () => void;
      formatError?: (err: unknown) => string;
    }) => {
      const { buildPayload, onSuccess, onSlotConflict, formatError } = params;
      const formatErr =
        formatError ?? ((err: unknown) => (err instanceof Error ? err.message : 'Submit failed'));

      if (submitSuccessRef.current || submitLockRef.current) return;

      if (!apiToken) {
        setSubmitError(formatErr(new Error('Unauthorized')));
        return;
      }

      const base = buildPayload(contactContext);
      if (!base) return;

      submitLockRef.current = true;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const data = await createBookingApiReservation(base, apiToken);
        setSubmitSuccess(true);
        onSuccess?.(data);
      } catch (err) {
        if (submitSuccessRef.current) return;
        if (isBookingSlotConflict(err)) {
          onSlotConflict?.();
        }
        setSubmitError(formatErr(err));
      } finally {
        submitLockRef.current = false;
        setSubmitting(false);
      }
    },
    [apiToken, contactContext]
  );

  return {
    /** @deprecated Prefer contactContext — kept for monitor helpers naming. */
    contactContext,
    authPrefillReady,
    submitting,
    submitError,
    submitSuccess,
    submitReservation,
  };
}

export function formatBookingSubmitError(
  err: unknown,
  t: (key: TranslationKey) => string
): string {
  if (isBookingSlotConflict(err)) return t('reservationErrorSlotTaken');
  if (isBookingRateLimited(err)) return t('reservationErrorRateLimit');
  if (err instanceof BookingApiError) return err.message;
  if (err instanceof Error) {
    if (err.message === 'fillFirstName') return t('reservationErrorFirstName');
    if (err.message === 'fillLastName') return t('reservationErrorLastName');
    if (err.message === 'fillEmail') return t('reservationErrorEmail');
    if (err.message === 'invalidEmail') return t('reservationErrorEmailInvalid');
    if (err.message === 'fillPhone') return t('reservationErrorPhone');
    if (err.message === 'Unauthorized') return t('reservationErrorGeneric');
    return err.message;
  }
  return t('reservationErrorGeneric');
}
