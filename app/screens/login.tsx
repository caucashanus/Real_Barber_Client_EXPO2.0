import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Keyboard, TouchableWithoutFeedback } from 'react-native';

import { requestClientOtp } from '@/api/auth';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState('+420');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setLoading] = useState(false);

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

  const handleContinue = async () => {
    setApiError('');
    if (!validatePhone(phone)) return;
    setLoading(true);
    try {
      const digitsOnly = phone.replace(/\D/g, '');
      const fullPhone = `${countryCode}${digitsOnly}`;
      const data = await requestClientOtp(fullPhone);

      if (!data.challengeSent) {
        setApiError(t('loginOtpChallengeNotSent'));
        return;
      }
      const expiresIn = data.expiresInSeconds ?? 600;
      router.push({
        pathname: '/screens/login-otp',
        params: {
          phone: fullPhone,
          displayName: data.exists ? (data.displayName ?? '') : '',
          expiresIn: String(expiresIn),
          requiresRegistration: data.exists ? '0' : '1',
        },
      });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('loginOtpRequestFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        showBackButton
        rightComponents={[
          <View
            key="password-login-badge"
            className="rounded-full border border-black px-3 py-1.5 dark:border-white">
            <ThemedText
              className="text-xs font-medium"
              onPress={() => router.push('/screens/login-password')}>
              {t('welcomePasswordLoginBadge')}
            </ThemedText>
          </View>,
        ]}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-light-primary p-6 dark:bg-dark-primary">
          <View className="mt-8">
            <ThemedText className="mb-1 text-3xl font-bold">{t('loginWelcomeBack')}</ThemedText>
            <ThemedText className="mb-6 text-light-subtext dark:text-dark-subtext">
              {t('loginPhoneStepSubtitle')}
            </ThemedText>

            <View className="mb-4">
              <ThemedText className="mb-1 font-medium text-light-text dark:text-dark-text">
                {t('signupPhoneLabel')}
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

            {apiError ? (
              <ThemedText className="mb-4 text-sm text-red-500 dark:text-red-400">
                {apiError}
              </ThemedText>
            ) : null}

            <Button
              title={t('loginContinue')}
              onPress={() => void handleContinue()}
              loading={isLoading}
              size="large"
              className="mb-6"
              textClassName="font-bold text-lg"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}
