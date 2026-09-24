import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createBookingApiReservation } from '@/api/bookingEngine';
import type { CrmClient } from '@/api/auth';
import type { TranslationKey } from '@/locales';
import { BookingApiError, isBookingRateLimited, isBookingSlotConflict } from '@/lib/booking/booking-api/errors';
import {
  clientToBookingReservationContact,
  type BookingReservationContact,
} from '@/lib/booking/authContact';

export type BookingReservationSubmitContext = BookingReservationContact;

const EMPTY_CONTACT: BookingReservationContact = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

/**
 * Auth-only booking submit — contact always comes from logged-in CRM client (same API payload as web).
 */
export function useBookingReservationSubmit(
  client: CrmClient | null | undefined,
  apiToken: string | null
) {
  const [contact, setContact] = useState<BookingReservationContact>(EMPTY_CONTACT);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submitLockRef = useRef(false);
  const submitSuccessRef = useRef(false);

  useEffect(() => {
    submitSuccessRef.current = submitSuccess;
  }, [submitSuccess]);

  useEffect(() => {
    setContact(clientToBookingReservationContact(client) ?? EMPTY_CONTACT);
  }, [client]);

  const bookingContactReady = useMemo(
    () => clientToBookingReservationContact(client) != null,
    [client]
  );

  const contactContext = useMemo<BookingReservationSubmitContext>(
    () => ({
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
    }),
    [contact]
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

      if (!bookingContactReady) {
        setSubmitError(formatErr(new Error('profileIncomplete')));
        return;
      }

      const base = buildPayload(contactContext);
      if (!base) {
        setSubmitError(formatErr(new Error('reservationIncomplete')));
        return;
      }

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
    [apiToken, bookingContactReady, contactContext]
  );

  return {
    contactContext,
    bookingContactReady,
    submitting,
    submitError,
    submitSuccess,
    submitReservation,
  };
}

function isOpaqueBackendValidationMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('too small') ||
    lower.includes('expected string') ||
    lower.includes('invalid input') ||
    lower.includes('required') ||
    lower.includes('zod')
  );
}

export function formatBookingSubmitError(
  err: unknown,
  t: (key: TranslationKey) => string
): string {
  if (isBookingSlotConflict(err)) return t('reservationErrorSlotTaken');
  if (isBookingRateLimited(err)) return t('reservationErrorRateLimit');
  if (err instanceof BookingApiError) {
    if (isOpaqueBackendValidationMessage(err.message)) {
      return t('reservationErrorGeneric');
    }
    return err.message;
  }
  if (err instanceof Error) {
    if (err.message === 'profileIncomplete') return t('bookingSummaryProfileIncomplete');
    if (err.message === 'fillFirstName') return t('reservationErrorFirstName');
    if (err.message === 'fillLastName') return t('reservationErrorLastName');
    if (err.message === 'fillEmail') return t('reservationErrorEmail');
    if (err.message === 'invalidEmail') return t('reservationErrorEmailInvalid');
    if (err.message === 'fillPhone') return t('reservationErrorPhone');
    if (err.message === 'reservationIncomplete') return t('reservationErrorGeneric');
    if (err.message === 'Unauthorized') return t('reservationErrorGeneric');
    if (isOpaqueBackendValidationMessage(err.message)) {
      return t('reservationErrorGeneric');
    }
    return err.message;
  }
  return t('reservationErrorGeneric');
}
