import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createBookingApiReservation,
  requestBookingApiOtp,
} from '@/api/bookingEngine';
import type { CrmClient } from '@/api/auth';
import type { TranslationKey } from '@/locales';
import { BookingApiError, isBookingRateLimited, isBookingSlotConflict } from '@/lib/booking/booking-api/errors';
import { isAuthContactComplete, mapAuthClientToBookingContact } from '@/lib/booking/authContact';
import {
  buildFullPhone,
  phoneCountrySelectValueFromIso2,
} from '@/utils/phone';

const CONTACT_STORAGE_KEY = '@rezervace-contact';

export type BookingContactFields = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNationalDigits: string;
  /** Hodnota selectu předvolby (`+420`, `+1-US`, …). */
  phoneCountryCode: string;
  notes: string;
  marketingConsent: boolean;
};

export type BookingReservationSubmitContext = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const EMPTY_CONTACT: BookingContactFields = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNationalDigits: '',
  phoneCountryCode: '+420',
  notes: '',
  marketingConsent: false,
};

function normalizeStoredContactFields(
  parsed: Partial<BookingContactFields> & { phoneCountryIso?: string }
): Partial<BookingContactFields> {
  const { phoneCountryIso, ...rest } = parsed;
  if (rest.phoneCountryCode) return rest;
  if (phoneCountryIso) {
    return {
      ...rest,
      phoneCountryCode: phoneCountrySelectValueFromIso2(phoneCountryIso),
    };
  }
  return rest;
}

export function useBookingEngineContact(client: CrmClient | null | undefined, apiToken: string | null) {
  const [fields, setFields] = useState<BookingContactFields>(EMPTY_CONTACT);
  const [authPrefillReady, setAuthPrefillReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [awaitingPhoneOtp, setAwaitingPhoneOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState('');
  const [otpChallengeToken, setOtpChallengeToken] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const submitSuccessRef = useRef(false);

  useEffect(() => {
    submitSuccessRef.current = submitSuccess;
  }, [submitSuccess]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (client && isAuthContactComplete(client)) {
        const mapped = mapAuthClientToBookingContact(client);
        if (mapped && !cancelled) {
          setFields((prev) => ({
            ...prev,
            firstName: mapped.firstName,
            lastName: mapped.lastName,
            email: mapped.email,
            phoneCountryCode: phoneCountrySelectValueFromIso2(mapped.countryIso),
            phoneNationalDigits: mapped.nationalDigits,
          }));
          setAuthPrefillReady(true);
          return;
        }
      }

      const raw = await AsyncStorage.getItem(CONTACT_STORAGE_KEY).catch(() => null);
      if (cancelled) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<BookingContactFields> & {
            phoneCountryIso?: string;
          };
          setFields((prev) => ({ ...prev, ...normalizeStoredContactFields(parsed) }));
        } catch {
          // ignore
        }
      }
      setAuthPrefillReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const contactContext = useMemo<BookingReservationSubmitContext>(
    () => ({
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: buildFullPhone(fields.phoneCountryCode, fields.phoneNationalDigits),
    }),
    [fields]
  );

  const setField = useCallback(<K extends keyof BookingContactFields>(
    key: K,
    value: BookingContactFields[K]
  ) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      void AsyncStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetOtpState = useCallback(() => {
    setAwaitingPhoneOtp(false);
    setOtpDigits('');
    setOtpChallengeToken(null);
  }, []);

  const cancelPhoneOtp = useCallback(() => {
    resetOtpState();
    setSubmitError(null);
  }, [resetOtpState]);

  const validateFields = useCallback((): string | null => {
    if (!fields.firstName.trim()) return 'fillFirstName';
    if (!fields.lastName.trim()) return 'fillLastName';
    if (!fields.email.trim()) return 'fillEmail';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) return 'invalidEmail';
    const digits = fields.phoneNationalDigits.replace(/\D/g, '');
    if (digits.length < 9) return 'fillPhone';
    return null;
  }, [fields]);

  const submitReservation = useCallback(
    async (params: {
      buildPayload: (ctx: BookingReservationSubmitContext) => Record<string, unknown> | null;
      onSuccess?: (data: unknown) => void;
      onSlotConflict?: () => void;
      formatError?: (err: unknown) => string;
    }) => {
      const { buildPayload, onSuccess, onSlotConflict, formatError } = params;
      const formatErr = formatError ?? ((err: unknown) => (err instanceof Error ? err.message : 'Submit failed'));

      if (submitSuccessRef.current || submitLockRef.current) return;

      if (awaitingPhoneOtp && otpChallengeToken) {
        const code = otpDigits.replace(/\D/g, '');
        if (code.length !== 6) {
          setSubmitError(formatErr(new Error('OTP_CODE')));
          return;
        }
        const base = buildPayload(contactContext);
        if (!base) return;
        submitLockRef.current = true;
        setSubmitting(true);
        setSubmitError(null);
        try {
          const data = await createBookingApiReservation({
            ...base,
            otpCode: code,
            challengeToken: otpChallengeToken,
          });
          setSubmitSuccess(true);
          resetOtpState();
          onSuccess?.(data);
        } catch (err) {
          if (submitSuccessRef.current) return;
          setSubmitError(formatErr(err));
        } finally {
          submitLockRef.current = false;
          setSubmitting(false);
        }
        return;
      }

      const validationKey = validateFields();
      if (validationKey && !apiToken) {
        setSubmitError(validationKey);
        return;
      }

      const base = buildPayload(contactContext);
      if (!base) return;

      submitLockRef.current = true;
      setSubmitting(true);
      setSubmitError(null);
      try {
        if (apiToken) {
          const data = await createBookingApiReservation(base, apiToken);
          setSubmitSuccess(true);
          onSuccess?.(data);
          return;
        }

        const otpRes = await requestBookingApiOtp(contactContext.phone);
        if (!otpRes.requiresOtpVerification) {
          const data = await createBookingApiReservation(base);
          setSubmitSuccess(true);
          onSuccess?.(data);
          return;
        }

        setAwaitingPhoneOtp(true);
        setOtpChallengeToken(otpRes.challengeToken ?? null);
      } catch (err) {
        if (submitSuccessRef.current) return;
        if (isBookingSlotConflict(err)) {
          onSlotConflict?.();
          setSubmitError(formatErr(err));
        } else if (isBookingRateLimited(err)) {
          setSubmitError(formatErr(err));
        } else {
          setSubmitError(formatErr(err));
        }
      } finally {
        submitLockRef.current = false;
        setSubmitting(false);
      }
    },
    [
      awaitingPhoneOtp,
      otpChallengeToken,
      otpDigits,
      contactContext,
      validateFields,
      apiToken,
      resetOtpState,
    ]
  );

  return {
    fields,
    setField,
    contactContext,
    authPrefillReady,
    submitting,
    submitError,
    submitSuccess,
    awaitingPhoneOtp,
    otpDigits,
    setOtpDigits,
    cancelPhoneOtp,
    submitReservation,
    validateFields,
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
    return err.message;
  }
  return t('reservationErrorGeneric');
}
