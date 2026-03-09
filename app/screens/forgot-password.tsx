import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';
import { forgotPassword } from '@/api/auth';
import { useTranslation } from '@/app/hooks/useTranslation';

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
          className="flex-1 bg-light-primary dark:bg-dark-primary p-6"
          style={{ paddingTop: insets.top }}
        >
          <View className="mt-8 items-center">
            <View className="w-20 h-20 rounded-full bg-green-500/20 items-center justify-center mb-4">
              <Icon name="Check" size={40} className="text-green-600 dark:text-green-400" />
            </View>
            <ThemedText className="text-xl font-semibold text-light-text dark:text-dark-text text-center mb-2">
              Žádost odeslána
            </ThemedText>
            <ThemedText className="text-light-subtext dark:text-dark-subtext text-center mb-6">
              Zkontrolujte svou emailovou schránku nebo SMS. Pokud zpráva nedorazí do několika minut,
              zkontrolujte složku se spamem.
            </ThemedText>
            <Button title={t('forgotPasswordBackToLogin')} onPress={() => router.back()} size="large" className="mt-4" />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Header showBackButton />
      <View
        className="flex-1 bg-light-primary dark:bg-dark-primary p-6"
        style={{ paddingTop: insets.top }}
      >
        <View className="mt-8">
          <ThemedText className="text-3xl font-bold mb-1">Zapomenuté heslo</ThemedText>
          <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
            {resetMode === 'email'
              ? "Zadejte email a pošleme vám odkaz pro obnovení hesla."
              : 'Zadejte telefonní číslo a pošleme vám odkaz pro obnovení hesla.'}
          </ThemedText>

          <View className="flex-row gap-2 mb-6">
            <Pressable
              onPress={() => setResetMode('email')}
              className={`flex-1 py-3 rounded-xl border ${
                resetMode === 'email'
                  ? 'border-black dark:border-white bg-light-secondary dark:bg-dark-secondary'
                  : 'border-light-secondary dark:border-dark-secondary'
              }`}
            >
              <ThemedText className="text-center font-medium">Email</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setResetMode('phone')}
              className={`flex-1 py-3 rounded-xl border ${
                resetMode === 'phone'
                  ? 'border-black dark:border-white bg-light-secondary dark:bg-dark-secondary'
                  : 'border-light-secondary dark:border-dark-secondary'
              }`}
            >
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
              <View className="flex-row gap-2 items-stretch">
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
            <ThemedText className="text-red-500 dark:text-red-400 text-sm mb-4">{apiError}</ThemedText>
          ) : null}

          <Button
            title={t('forgotPasswordSendRequest')}
            onPress={handleResetPassword}
            loading={isLoading}
            size="large"
            className="mb-6"
          />

          <View className="flex-row justify-center mt-8">
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
