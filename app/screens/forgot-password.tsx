import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { forgotPassword } from '@/api/auth';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';

type ResetMode = 'email' | 'phone';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [resetMode, setResetMode] = useState<ResetMode>(mode === 'phone' ? 'phone' : 'email');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+420');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === 'phone') setResetMode('phone');
  }, [mode]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) {
      setPhoneError('Telefon je povinný');
      return false;
    }
    if (digits.length < 9) {
      setPhoneError('Zadejte platné telefonní číslo');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleResetPassword = async () => {
    setApiError(null);
    let identifier: string;
    if (resetMode === 'email') {
      if (!validateEmail(email)) return;
      identifier = email.trim();
    } else {
      if (!validatePhone(phone)) return;
      identifier = `${countryCode}${phone.replace(/\D/g, '')}`;
    }
    setIsLoading(true);
    try {
      await forgotPassword(identifier);
      setIsSuccess(true);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Něco se pokazilo. Zkuste to znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Header showBackButton />
        <View
          className="flex-1 bg-light-primary p-6 dark:bg-dark-primary"
          style={{ paddingTop: insets.top }}>
          <View className="mt-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <Icon name="Check" size={40} className="text-green-600 dark:text-green-400" />
            </View>
            <ThemedText className="mb-2 text-center text-xl font-semibold text-light-text dark:text-dark-text">
              Žádost odeslána
            </ThemedText>
            <ThemedText className="mb-6 text-center text-light-subtext dark:text-dark-subtext">
              Zkontrolujte svou emailovou schránku nebo SMS. Pokud zpráva nedorazí do několika
              minut, zkontrolujte složku se spamem.
            </ThemedText>
            <Button
              title={t('forgotPasswordBackToLogin')}
              onPress={() => router.back()}
              size="large"
              className="mt-4"
            />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Header showBackButton />
      <View
        className="flex-1 bg-light-primary p-6 dark:bg-dark-primary"
        style={{ paddingTop: insets.top }}>
        <View className="mt-8">
          <ThemedText className="mb-1 text-3xl font-bold">Zapomenuté heslo</ThemedText>
          <ThemedText className="mb-6 text-light-subtext dark:text-dark-subtext">
            {resetMode === 'email'
              ? 'Zadejte email a pošleme vám odkaz pro obnovení hesla.'
              : 'Zadejte telefonní číslo a pošleme vám odkaz pro obnovení hesla.'}
          </ThemedText>

          <View className="mb-6 flex-row gap-2">
            <Pressable
              onPress={() => setResetMode('email')}
              className={`flex-1 rounded-xl border py-3 ${
                resetMode === 'email'
                  ? 'border-black bg-light-secondary dark:border-white dark:bg-dark-secondary'
                  : 'border-light-secondary dark:border-dark-secondary'
              }`}>
              <ThemedText className="text-center font-medium">Email</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setResetMode('phone')}
              className={`flex-1 rounded-xl border py-3 ${
                resetMode === 'phone'
                  ? 'border-black bg-light-secondary dark:border-white dark:bg-dark-secondary'
                  : 'border-light-secondary dark:border-dark-secondary'
              }`}>
              <ThemedText className="text-center font-medium">Pomocí tel. čísla</ThemedText>
            </Pressable>
          </View>

          {resetMode === 'email' ? (
            <Input
              label={t('forgotPasswordEmail')}
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
          ) : (
            <View className="mb-4">
              <ThemedText className="mb-1 font-medium text-light-text dark:text-dark-text">
                Telefonní číslo
              </ThemedText>
              <View className="flex-row items-stretch gap-2">
                <View style={{ width: 100 }}>
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
          )}

          {apiError ? (
            <ThemedText className="mb-4 text-sm text-red-500 dark:text-red-400">
              {apiError}
            </ThemedText>
          ) : null}

          <Button
            title={t('forgotPasswordSendRequest')}
            onPress={handleResetPassword}
            loading={isLoading}
            size="large"
            className="mb-6"
          />

          <View className="mt-8 flex-row justify-center">
            <ThemedText className="text-light-subtext dark:text-dark-subtext">
              Pamatujete si heslo?{' '}
            </ThemedText>
            <Link href="/screens/login" asChild>
              <Pressable>
                <ThemedText className="underline">Log in</ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </>
  );
}
