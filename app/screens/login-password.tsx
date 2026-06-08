import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { loginWithPhone } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import PhoneInput from '@/components/forms/PhoneInput';
import AuthScreenLayout from '@/components/layout/AuthScreenLayout';
import { buildFullPhone, validatePhoneDigits } from '@/utils/phone';

export default function LoginPasswordScreen() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();
  const [countryCode, setCountryCode] = useState('+420');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setLoading] = useState(false);

  const handleLogin = async () => {
    setApiError('');
    const phoneValidation = validatePhoneDigits(phone);
    if (!phoneValidation.valid) {
      setPhoneError(t(phoneValidation.errorKey!));
    } else {
      setPhoneError('');
    }

    if (!password.trim()) {
      setPasswordError(t('signupPasswordRequired'));
    } else {
      setPasswordError('');
    }

    if (!phoneValidation.valid || !password.trim()) return;

    setLoading(true);
    try {
      const data = await loginWithPhone(buildFullPhone(countryCode, phone), password);
      await setAuth(data.token, data.apiToken, data.client);
      router.replace('/(tabs)/(home)');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('loginOtpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showBackButton />
      <AuthScreenLayout>
        <View className="mt-8">
          <ThemedText className="mb-1 text-3xl font-bold">{t('loginWelcomeBack')}</ThemedText>
          <ThemedText className="mb-6 text-light-subtext dark:text-dark-subtext">
            {t('loginPasswordOtpHint')}
          </ThemedText>

          <PhoneInput
            label={t('signupPhoneLabel')}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            phone={phone}
            onPhoneChange={setPhone}
            error={phoneError}
            onValidate={(result) => {
              if (result.valid) setPhoneError('');
              else if (result.errorKey) setPhoneError(t(result.errorKey));
            }}
          />

          <Input
            label={t('loginPassword')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError && text.trim()) setPasswordError('');
            }}
            error={passwordError}
            isPassword
            autoCapitalize="none"
            containerClassName="mb-4"
          />

          {apiError ? (
            <ThemedText className="mb-4 text-sm text-red-500 dark:text-red-400">
              {apiError}
            </ThemedText>
          ) : null}

          <Button
            title={t('loginTitle')}
            onPress={() => void handleLogin()}
            loading={isLoading}
            size="large"
            className="mb-4"
            textClassName="font-bold text-lg"
          />

          <Link href="/screens/forgot-password?mode=phone" asChild>
            <ThemedText className="text-center text-sm text-light-subtext underline dark:text-dark-subtext">
              {t('loginForgotPassword')}
            </ThemedText>
          </Link>

          <Link href="/screens/login" asChild>
            <ThemedText className="mt-4 text-center text-sm font-medium text-light-subtext dark:text-dark-subtext">
              {t('loginPasswordBackToOtp')}
            </ThemedText>
          </Link>
        </View>
      </AuthScreenLayout>
    </>
  );
}
