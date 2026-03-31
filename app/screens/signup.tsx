import React, { useCallback, useMemo, useState, useRef, type MutableRefObject } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import { DatePicker } from '@/components/forms/DatePicker';
import ThemedText from '@/components/ThemedText';
import MultiStep, { Step, type MultiStepHandle } from '@/components/MultiStep';
import { useTranslation } from '@/app/hooks/useTranslation';
import { registerWithOtpToken, registerWithPhone, type CrmClient, type RegisterOptions } from '@/api/auth';
import {
  getClientMe,
  patchClientMe,
  uploadClientAvatar,
  type ClientMe,
  type UpdateClientMeBody,
} from '@/api/client';
import { useAuth } from '@/app/contexts/AuthContext';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';
import { formatBirthdayToIsoUtcMidnight, formatToYYYYMMDD } from '@/utils/date';
import { MOCK_SIGNUP } from '@/constants/mockSignup';
import { getEmailDomainChipSuggestions } from '@/utils/emailSuggestions';
import { Chip } from '@/components/Chip';
import SignupAvatarPicker, { type AvatarChoice } from '@/components/signup/SignupAvatarPicker';

/** Sjednocené výchozí heslo pro nové účty z registrace (backend + případné přihlášení heslem). */
const DEFAULT_SIGNUP_PASSWORD = '123456';

const MOCK_AUTH_TOKEN = 'mock-signup-token';
const MOCK_API_TOKEN = 'mock-signup-api-token';

function buildMockCrmClient(input: {
  firstName: string;
  lastName: string;
  email: string;
  fullPhone: string;
  avatarUrl: string;
  birthday: Date | null;
}): CrmClient {
  const now = new Date().toISOString();
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim() || 'Demo user';
  return {
    id: 'mock-signup-client',
    name,
    email: input.email.trim() || 'demo@local.app',
    phone: input.fullPhone,
    avatarUrl: input.avatarUrl.trim() || null,
    address: '',
    whatsapp: null,
    birthday: input.birthday ? formatToYYYYMMDD(input.birthday) : null,
    lastVisit: null,
    createdAt: now,
    updatedAt: now,
  };
}

function clientMeToCrm(me: ClientMe): CrmClient {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    phone: me.phone ?? '',
    avatarUrl: me.avatarUrl,
    address: me.address ?? '',
    whatsapp: me.whatsapp,
    birthday: me.birthday,
    lastVisit: me.lastVisit,
    createdAt: me.createdAt,
    updatedAt: me.updatedAt,
  };
}

function emailRequiredValid(emailValue: string): boolean {
  const trimmed = emailValue.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function phoneDigitsValid(phoneDisplay: string): boolean {
  const digits = phoneDisplay.replace(/\D/g, '');
  return digits.length >= 9;
}

/** Pro mock / zobrazení (katalog = URL z API, vlastní = file://). */
function avatarChoiceToStoredUrl(choice: AvatarChoice): string {
  if (choice.kind === 'none') return '';
  if (choice.kind === 'catalog') return choice.url;
  return choice.uri;
}

/** HTTPS URL katalogu pro pole avatarUrl při register. */
function avatarUrlForRegister(choice: AvatarChoice): string | undefined {
  if (choice.kind !== 'catalog') return undefined;
  const u = choice.url.trim();
  if (u.startsWith('https://') || u.startsWith('http://')) return u;
  return undefined;
}

function paramString(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export default function SignupScreen() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();
  const signupParams = useLocalSearchParams<{ countryCode?: string | string[]; phoneDigits?: string | string[]; phone?: string | string[]; registrationToken?: string | string[] }>();

  const fullPhoneFromOtp = useMemo(() => paramString(signupParams.phone).trim(), [signupParams.phone]);
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
  /** Z loginu (OTP „neexistuje“) – krok telefonu přeskakujeme. */
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
    const digits = paramString(signupParams.phoneDigits) || (fullPhoneFromOtp ? fullPhoneFromOtp.replace(/\D/g, '') : '');
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

  /** Index kroku, po kterém registrujeme účet. Pro OTP registraci hned po jménu. */
  const registerTriggerStepIndex = registrationTokenFromOtp
    ? 0
    : phoneLockedFromLogin
      ? 2
      : 3;

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

  const isStepValid = useCallback(
    (idx: number): boolean => {
      if (phoneLockedFromLogin) {
        switch (idx) {
          case 0:
            return firstName.trim().length > 0 && lastName.trim().length > 0;
          case 1:
            return emailRequiredValid(email);
          case 2:
          case 3:
            return true;
          default:
            return true;
        }
      }
      switch (idx) {
        case 0:
          return firstName.trim().length > 0 && lastName.trim().length > 0;
        case 1:
          return phoneDigitsValid(phone);
        case 2:
          return emailRequiredValid(email);
        case 3:
        case 4:
          return true;
        default:
          return true;
      }
    },
    [phoneLockedFromLogin, firstName, lastName, phone, email]
  );

  const isNextDisabled = useCallback(
    (currentStep: number) => !isStepValid(currentStep) || submitting || registerBusy,
    [isStepValid, submitting, registerBusy]
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
        // pro OTP registraci není e-mail/birthday nutný v této fázi – doženeme přes PATCH /client/me
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
            password: DEFAULT_SIGNUP_PASSWORD,
            ...registerOpts,
          })
        : await registerWithPhone(fullPhone, DEFAULT_SIGNUP_PASSWORD, registerOpts);
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
  }, [birthday, countryCode, email, firstName, fullPhoneFromOtp, lastName, phone, registrationTokenFromOtp, setAuth, t]);

  const onBeforeNext = useCallback(
    async (currentStepIndex: number) => {
      if (currentStepIndex !== registerTriggerStepIndex) return true;
      if (registerDoneRef.current) return true;
      return performRegisterAfterBirthday();
    },
    [registerTriggerStepIndex, performRegisterAfterBirthday]
  );

  /** Po kroku avatar: vlastní soubor přes /client/avatar, URL přes PATCH /client/me. */
  const handleFinalizeSignup = async () => {
    if (submitting || registerBusy) return;
    setApiError('');
    // Pokud uživatel přeskočil volitelný krok (např. datum narození),
    // MultiStep může dokončit flow bez zavolání onBeforeNext na registerTriggerStepIndex.
    // V tom případě registraci doplníme tady, než začneme nahrávat avatar / patchovat profil.
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

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <MultiStep
        ref={multiStepRef}
        onComplete={() => void handleFinalizeSignup()}
        onClose={() => router.back()}
        isNextDisabled={isNextDisabled}
        footerLoading={submitting || registerBusy}
        onBeforeNext={onBeforeNext}
        onStepIndexChange={(idx, reason) => {
          setApiError('');
          if (
            reason === 'back' &&
            (idx === registerTriggerStepIndex - 1 || idx === registerTriggerStepIndex)
          ) {
            registerDoneRef.current = false;
            sessionRef.current = null;
          }
        }}
        showStepIndicator
        className="flex-1"
      >
        <Step title={t('signupStepNameTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-3xl font-bold text-light-text dark:text-dark-text mb-1">{t('signupCreateAccount')}</ThemedText>
            <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">{t('signupCreateAccountDesc')}</ThemedText>
            <Input
              label={t('editProfileFirstName')}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              containerClassName="mb-4"
            />
            <Input
              label={t('editProfileLastName')}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              containerClassName="mb-4"
            />
          </View>
        </Step>

        {!phoneLockedFromLogin ? (
          <Step title={t('signupStepPhoneTitle')}>
            <View className="px-6 pt-4 pb-8">
              <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
                {t('signupStepPhoneTitle')}
              </ThemedText>
              <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
                {t('signupStepPhoneSubtitle')}
              </ThemedText>
              <ThemedText className="mb-1 font-medium text-light-text dark:text-dark-text">{t('signupPhoneLabel')}</ThemedText>
              <View className="flex-row gap-2 items-stretch mb-4">
                <View className="w-[100px]">
                  <Select
                    options={COUNTRY_CODE_OPTIONS}
                    value={countryCode}
                    onChange={(v) => setCountryCode(String(v))}
                    placeholder="+420"
                    variant="classic"
                    className="mb-0"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(formatPhoneDisplay(text));
                      if (phoneError) validatePhone(text);
                    }}
                    error={phoneError}
                    keyboardType="phone-pad"
                    placeholder="123 456 789"
                    autoComplete="tel"
                    containerClassName="mb-0"
                  />
                </View>
              </View>
            </View>
          </Step>
        ) : null}

        <Step title={t('signupStepEmailTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepEmailTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
              {t('signupStepEmailSubtitle')}
            </ThemedText>
            <Input
              label={t('signupEmail')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              containerClassName="mb-4"
            />
            {emailDomainSuggestions.length > 0 ? (
              <View className="mb-2">
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
                  {t('signupEmailDomainHint')}
                </ThemedText>
                <View className="flex-row flex-wrap gap-2.5">
                  {emailDomainSuggestions.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      size="md"
                      onPress={() => {
                        const at = email.indexOf('@');
                        const local = at >= 0 ? email.slice(0, at).trim() : email.trim();
                        const next = `${local}@${domain}`;
                        setEmail(next);
                        if (emailError) validateEmail(next);
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {apiError ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mt-2">{apiError}</ThemedText>
            ) : null}
          </View>
        </Step>

        <Step title={t('signupStepBirthdayTitle')} optional optionalSkipInHeader={false}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepBirthdayTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-2">
              {t('signupStepBirthdaySubtitle')}
            </ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext leading-5">
              {t('signupStepBirthdayBenefits')}
            </ThemedText>
            <View className="mt-4 mb-6 self-start">
              <Chip
                label={t('multiStepSkip')}
                size="sm"
                onPress={() => multiStepRef.current?.skipOptionalStep()}
              />
            </View>
            <DatePicker
              label={t('editProfileBirthday')}
              value={birthday ?? undefined}
              onChange={(d) => setBirthday(d)}
              maxDate={maxBirthDate}
              minDate={minBirthDate}
              variant="classic"
            />
            {apiError ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mt-4">{apiError}</ThemedText>
            ) : null}
          </View>
        </Step>

        <Step title={t('signupStepAvatarTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepAvatarTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
              {t('signupStepAvatarSubtitle')}
            </ThemedText>
            <SignupAvatarPicker
              value={avatarChoice}
              onChange={setAvatarChoice}
              carouselHint={t('signupAvatarCarouselHint')}
            />
            {apiError ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mt-4">{apiError}</ThemedText>
            ) : null}
          </View>
        </Step>
      </MultiStep>
    </View>
  );
}
