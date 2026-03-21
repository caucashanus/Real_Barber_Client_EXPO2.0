import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import { DatePicker } from '@/components/forms/DatePicker';
import ThemedText from '@/components/ThemedText';
import MultiStep, { Step } from '@/components/MultiStep';
import { useTranslation } from '@/app/hooks/useTranslation';
import { registerWithPhone, type CrmClient } from '@/api/auth';
import { patchClientMe, type ClientMe, type UpdateClientMeBody } from '@/api/client';
import { useAuth } from '@/app/contexts/AuthContext';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';
import { formatToYYYYMMDD } from '@/utils/date';

const MIN_PASSWORD_LEN = 4;

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

function isValidOptionalHttpUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function emailOptionalValid(emailValue: string): boolean {
  const trimmed = emailValue.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function phoneDigitsValid(phoneDisplay: string): boolean {
  const digits = phoneDisplay.replace(/\D/g, '');
  return digits.length >= 9;
}

export default function SignupScreen() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+420');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUrlError, setAvatarUrlError] = useState('');

  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthText, setStrengthText] = useState('');

  const maxBirthDate = useMemo(() => new Date(), []);
  const minBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d;
  }, []);

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

  const validateEmailOptional = (emailValue: string) => {
    const trimmed = emailValue.trim();
    if (!trimmed) {
      setEmailError('');
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t('signupEmailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const updatePasswordMeter = (pwd: string) => {
    if (pwd.length === 0) {
      setPasswordStrength(0);
      setStrengthText('');
      return;
    }
    if (pwd.length < MIN_PASSWORD_LEN) {
      const score = Math.round((pwd.length / MIN_PASSWORD_LEN) * 40);
      setPasswordStrength(score);
      setStrengthText(t('signupPasswordMeterShort'));
      return;
    }
    let score = 40;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    score = Math.min(100, score);
    setPasswordStrength(score);
    setStrengthText(t('signupPasswordMeterHint'));
  };

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordError(t('signupPasswordRequired'));
      return false;
    }
    if (pwd.length < MIN_PASSWORD_LEN) {
      setPasswordError(t('signupPasswordMinLength'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirm: string) => {
    if (!confirm) {
      setConfirmPasswordError(t('signupConfirmRequired'));
      return false;
    }
    if (confirm !== password) {
      setConfirmPasswordError(t('signupPasswordMismatch'));
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateAvatarUrl = (value: string) => {
    if (!isValidOptionalHttpUrl(value)) {
      setAvatarUrlError(t('signupAvatarUrlInvalid'));
      return false;
    }
    setAvatarUrlError('');
    return true;
  };

  const isStepValid = useCallback(
    (idx: number): boolean => {
      switch (idx) {
        case 0:
          return firstName.trim().length > 0 && lastName.trim().length > 0;
        case 1:
          return phoneDigitsValid(phone);
        case 2:
          return emailOptionalValid(email);
        case 3:
          return (
            password.length >= MIN_PASSWORD_LEN &&
            confirmPassword.length > 0 &&
            password === confirmPassword
          );
        case 4:
          return birthday !== null;
        case 5:
          return isValidOptionalHttpUrl(avatarUrl);
        default:
          return true;
      }
    },
    [firstName, lastName, phone, email, password, confirmPassword, birthday, avatarUrl]
  );

  const isNextDisabled = useCallback(
    (currentStep: number) => !isStepValid(currentStep) || submitting,
    [isStepValid, submitting]
  );

  const handleRegister = async () => {
    if (submitting) return;
    setApiError('');
    const phoneOk = validatePhone(phone);
    const emailOk = validateEmailOptional(email);
    const pwdOk = validatePassword(password);
    const confirmOk = validateConfirmPassword(confirmPassword);
    const avatarOk = validateAvatarUrl(avatarUrl);
    if (!phoneOk || !emailOk || !pwdOk || !confirmOk || !avatarOk || !birthday) {
      return;
    }

    setSubmitting(true);
    try {
      const digitsOnly = phone.replace(/\D/g, '');
      const fullPhone = `${countryCode}${digitsOnly}`;
      const data = await registerWithPhone(fullPhone, password, {
        email: email.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await setAuth(data.token, data.apiToken, data.client);

      const patchBody: UpdateClientMeBody = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthday: formatToYYYYMMDD(birthday),
      };
      if (avatarUrl.trim()) {
        patchBody.avatar = avatarUrl.trim();
      }
      const me = await patchClientMe(data.apiToken, patchBody);
      await setAuth(data.token, data.apiToken, clientMeToCrm(me));

      router.replace('/(tabs)/(home)');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('signupRegisterFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const barColorClass =
    passwordStrength < 40
      ? 'bg-red-500'
      : passwordStrength < 75
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <MultiStep
        onComplete={() => void handleRegister()}
        onClose={() => router.back()}
        isNextDisabled={isNextDisabled}
        footerLoading={submitting}
        onStepIndexChange={() => setApiError('')}
        showStepIndicator
        className="flex-1"
      >
        <Step title={t('signupStepNameTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-3xl font-bold text-light-text dark:text-dark-text mb-1">{t('signupCreateAccount')}</ThemedText>
            <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">{t('signupCreateAccountDesc')}</ThemedText>
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepNameTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
              {t('signupStepNameSubtitle')}
            </ThemedText>
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
            <View className="flex-row justify-center mt-4">
              <ThemedText className="text-light-subtext dark:text-dark-subtext">{t('signupAlreadyHave')}</ThemedText>
              <Link href="/screens/login" asChild>
                <Pressable>
                  <ThemedText className="underline text-light-text dark:text-dark-text">{t('signupLogIn')}</ThemedText>
                </Pressable>
              </Link>
            </View>
          </View>
        </Step>

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

        <Step title={t('signupStepEmailTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepEmailTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
              {t('signupStepEmailSubtitle')}
            </ThemedText>
            <Input
              label={t('signupEmailOptional')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmailOptional(text);
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              containerClassName="mb-4"
            />
          </View>
        </Step>

        <Step title={t('signupStepPasswordTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepPasswordTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
              {t('signupStepPasswordSubtitle')}
            </ThemedText>
            <Input
              label={t('signupPassword')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                updatePasswordMeter(text);
                if (passwordError) validatePassword(text);
              }}
              error={passwordError}
              isPassword
              autoCapitalize="none"
              containerClassName="mb-4"
            />
            <Input
              label={t('signupConfirmPassword')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) validateConfirmPassword(text);
              }}
              error={confirmPasswordError}
              containerClassName="mb-4"
              isPassword
              autoCapitalize="none"
            />
            {password.length > 0 ? (
              <View className="mb-4">
                <View className="w-full h-1 bg-light-secondary dark:bg-dark-secondary rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${barColorClass}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </View>
                <ThemedText className="text-xs mt-1 text-light-subtext dark:text-dark-subtext">{strengthText}</ThemedText>
              </View>
            ) : null}
          </View>
        </Step>

        <Step title={t('signupStepBirthdayTitle')}>
          <View className="px-6 pt-4 pb-8">
            <ThemedText className="text-2xl font-semibold text-light-text dark:text-dark-text">
              {t('signupStepBirthdayTitle')}
            </ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-1 mb-6">
              {t('signupStepBirthdaySubtitle')}
            </ThemedText>
            <DatePicker
              label={t('editProfileBirthday')}
              value={birthday ?? undefined}
              onChange={(d) => setBirthday(d)}
              maxDate={maxBirthDate}
              minDate={minBirthDate}
              variant="classic"
            />
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
            <Input
              label={t('signupAvatarUrlLabel')}
              value={avatarUrl}
              onChangeText={(text) => {
                setAvatarUrl(text);
                if (avatarUrlError) validateAvatarUrl(text);
              }}
              error={avatarUrlError}
              keyboardType="url"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="https://…"
              containerClassName="mb-4"
            />
            {apiError ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mb-2">{apiError}</ThemedText>
            ) : null}
          </View>
        </Step>
      </MultiStep>
    </View>
  );
}
