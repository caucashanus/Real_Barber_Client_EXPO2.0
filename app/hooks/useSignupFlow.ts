import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react';

import { registerWithOtpToken, registerWithPhone, type RegisterOptions } from '@/api/auth';
import {
  getClientMe,
  patchClientMe,
  uploadClientAvatar,
  type UpdateClientMeBody,
} from '@/api/client';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { MultiStepHandle, StepNavigationReason } from '@/components/MultiStep';
import type { AvatarChoice } from '@/components/signup/SignupAvatarPicker';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import { MOCK_SIGNUP } from '@/constants/mockSignup';
import { formatBirthdayToIsoUtcMidnight } from '@/utils/date';
import { getEmailDomainChipSuggestions } from '@/utils/emailSuggestions';
import { formatPhoneDisplay } from '@/utils/phone';
import {
  avatarChoiceToStoredUrl,
  avatarUrlForRegister,
  buildMockCrmClient,
  clientMeToCrm,
  DEFAULT_SIGNUP_PASSWORD,
  emailRequiredValid,
  isSignupStepValid,
  MOCK_API_TOKEN,
  MOCK_AUTH_TOKEN,
  paramString,
} from '@/utils/signupHelpers';

export function useSignupFlow() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();
  const signupParams = useLocalSearchParams<{
    countryCode?: string | string[];
    phoneDigits?: string | string[];
    phone?: string | string[];
    registrationToken?: string | string[];
  }>();

  const fullPhoneFromOtp = useMemo(
    () => paramString(signupParams.phone).trim(),
    [signupParams.phone]
  );
  const registrationTokenFromOtp = useMemo(
    () => paramString(signupParams.registrationToken).trim(),
    [signupParams.registrationToken]
  );
  const phoneDigitsFromLogin = useMemo(() => {
    const fromDigits = paramString(signupParams.phoneDigits).replace(/\D/g, '');
    if (fromDigits) return fromDigits;
    if (fullPhoneFromOtp) return fullPhoneFromOtp.replace(/\D/g, '');
    return '';
  }, [signupParams.phoneDigits, fullPhoneFromOtp]);
  const phoneLockedFromLogin = phoneDigitsFromLogin.length >= 9;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState(() => {
    const fromParams = paramString(signupParams.countryCode);
    if (fromParams) return fromParams;
    if (fullPhoneFromOtp.startsWith('+420') || fullPhoneFromOtp.startsWith('420')) return '+420';
    return '+420';
  });
  const [phone, setPhone] = useState(() => {
    const digits =
      paramString(signupParams.phoneDigits) ||
      (fullPhoneFromOtp ? fullPhoneFromOtp.replace(/\D/g, '') : '');
    return digits ? formatPhoneDisplay(digits) : '';
  });
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [avatarChoice, setAvatarChoice] = useState<AvatarChoice>({ kind: 'none' });

  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registerBusy, setRegisterBusy] = useState(false);

  const multiStepRef = useRef<MultiStepHandle>(null);
  const registerDoneRef = useRef(false);
  const sessionRef: MutableRefObject<{ token: string; apiToken: string } | null> = useRef(null);

  const registerTriggerStepIndex = registrationTokenFromOtp ? 0 : phoneLockedFromLogin ? 2 : 3;

  const maxBirthDate = useMemo(() => new Date(), []);
  const minBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d;
  }, []);

  const emailDomainSuggestions = useMemo(() => getEmailDomainChipSuggestions(email), [email]);

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) {
      setPhoneError(t('signupPhoneRequired'));
      return false;
    }
    if (digits.length < 9) {
      setPhoneError(t('signupPhoneInvalid'));
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateEmail = (emailValue: string) => {
    const trimmed = emailValue.trim();
    if (!trimmed) {
      setEmailError(t('signupEmailRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t('signupEmailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const isNextDisabled = useCallback(
    (currentStep: number) =>
      !isSignupStepValid(currentStep, phoneLockedFromLogin, firstName, lastName, phone, email) ||
      submitting ||
      registerBusy,
    [phoneLockedFromLogin, firstName, lastName, phone, email, submitting, registerBusy]
  );

  const performRegisterAfterBirthday = useCallback(async (): Promise<boolean> => {
    setApiError('');
    const phoneOk = validatePhone(phone);
    const emailOk = registrationTokenFromOtp ? true : validateEmail(email);
    if (!phoneOk || !emailOk) return false;

    const digitsOnly = phone.replace(/\D/g, '');
    const fullPhone = fullPhoneFromOtp || `${countryCode}${digitsOnly}`;

    setRegisterBusy(true);
    try {
      if (MOCK_SIGNUP) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        sessionRef.current = { token: MOCK_AUTH_TOKEN, apiToken: MOCK_API_TOKEN };
        registerDoneRef.current = true;
        const client = buildMockCrmClient({
          firstName,
          lastName,
          email,
          fullPhone,
          avatarUrl: '',
          birthday,
        });
        await setAuth(MOCK_AUTH_TOKEN, MOCK_API_TOKEN, client);
        return true;
      }

      const registerOpts: RegisterOptions = {
        email: registrationTokenFromOtp ? undefined : email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (!registrationTokenFromOtp && birthday) {
        registerOpts.birthday = formatBirthdayToIsoUtcMidnight(birthday);
      }
      const data = registrationTokenFromOtp
        ? await registerWithOtpToken({
            phone: fullPhone,
            registrationToken: registrationTokenFromOtp,
            ...(CLIENT_APP_V1_ENABLED ? {} : { password: DEFAULT_SIGNUP_PASSWORD }),
            ...registerOpts,
          })
        : await registerWithPhone(
            fullPhone,
            CLIENT_APP_V1_ENABLED ? '' : DEFAULT_SIGNUP_PASSWORD,
            registerOpts
          );
      sessionRef.current = { token: data.token, apiToken: data.apiToken };
      registerDoneRef.current = true;
      await setAuth(data.token, data.apiToken, data.client);
      return true;
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('signupRegisterFailed'));
      return false;
    } finally {
      setRegisterBusy(false);
    }
  }, [
    birthday,
    countryCode,
    email,
    firstName,
    fullPhoneFromOtp,
    lastName,
    phone,
    registrationTokenFromOtp,
    setAuth,
    t,
  ]);

  const onBeforeNext = useCallback(
    async (currentStepIndex: number) => {
      if (currentStepIndex !== registerTriggerStepIndex) return true;
      if (registerDoneRef.current) return true;
      return performRegisterAfterBirthday();
    },
    [registerTriggerStepIndex, performRegisterAfterBirthday]
  );

  const handleFinalizeSignup = async () => {
    if (submitting || registerBusy) return;
    setApiError('');
    if (!sessionRef.current) {
      const ok = await performRegisterAfterBirthday();
      if (!ok || !sessionRef.current) {
        setApiError(t('signupRegisterFailed'));
        return;
      }
    }
    const { token, apiToken } = sessionRef.current;

    setSubmitting(true);
    try {
      const digitsOnly = phone.replace(/\D/g, '');
      const fullPhone = `${countryCode}${digitsOnly}`;

      if (MOCK_SIGNUP) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const client = buildMockCrmClient({
          firstName,
          lastName,
          email,
          fullPhone,
          avatarUrl: avatarChoiceToStoredUrl(avatarChoice),
          birthday,
        });
        await setAuth(MOCK_AUTH_TOKEN, MOCK_API_TOKEN, client);
        router.replace('/screens/signup-summary');
        return;
      }

      if (avatarChoice.kind === 'custom' && avatarChoice.uri) {
        await uploadClientAvatar(apiToken, { uri: avatarChoice.uri });
      }

      const patchBody: UpdateClientMeBody = {};
      const fn = firstName.trim();
      const ln = lastName.trim();
      if (fn) patchBody.firstName = fn;
      if (ln) patchBody.lastName = ln;
      const catalogUrl = avatarUrlForRegister(avatarChoice);
      if (catalogUrl) {
        patchBody.avatarUrl = catalogUrl;
      }
      const trimmedEmail = email.trim();
      if (trimmedEmail && emailRequiredValid(trimmedEmail)) {
        patchBody.email = trimmedEmail;
      }
      if (birthday) {
        patchBody.birthday = formatBirthdayToIsoUtcMidnight(birthday);
      }

      if (Object.keys(patchBody).length > 0) {
        const me = await patchClientMe(apiToken, patchBody);
        await setAuth(token, apiToken, clientMeToCrm(me));
      } else {
        const me = await getClientMe(apiToken);
        await setAuth(token, apiToken, clientMeToCrm(me));
      }

      router.replace('/screens/signup-summary');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('signupRegisterFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepIndexChange = (idx: number, reason: StepNavigationReason) => {
    setApiError('');
    if (
      reason === 'back' &&
      (idx === registerTriggerStepIndex - 1 || idx === registerTriggerStepIndex)
    ) {
      registerDoneRef.current = false;
      sessionRef.current = null;
    }
  };

  return {
    t,
    multiStepRef,
    phoneLockedFromLogin,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    countryCode,
    setCountryCode,
    phone,
    setPhone,
    phoneError,
    validatePhone,
    email,
    setEmail,
    emailError,
    validateEmail,
    birthday,
    setBirthday,
    minBirthDate,
    maxBirthDate,
    avatarChoice,
    setAvatarChoice,
    apiError,
    submitting,
    registerBusy,
    emailDomainSuggestions,
    isNextDisabled,
    onBeforeNext,
    handleFinalizeSignup,
    handleStepIndexChange,
  };
}
