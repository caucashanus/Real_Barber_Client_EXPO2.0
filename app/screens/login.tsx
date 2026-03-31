import React, { useState } from 'react';
import { View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import { requestClientOtp } from '@/api/auth';
import { useTranslation } from '@/app/hooks/useTranslation';
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
          <View key="password-login-badge" className="rounded-full border border-black dark:border-white px-3 py-1.5">
            <ThemedText
              className="text-xs font-medium"
              onPress={() => router.push('/screens/login-password')}
            >
              {t('welcomePasswordLoginBadge')}
            </ThemedText>
          </View>,
        ]}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
        <View className="mt-8">
          <ThemedText className="text-3xl font-bold mb-1">{t('loginWelcomeBack')}</ThemedText>
          <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
            {t('loginPhoneStepSubtitle')}
          </ThemedText>

          <View className="mb-4">
            <ThemedText className="mb-1 font-medium text-light-text dark:text-dark-text">
              {t('signupPhoneLabel')}
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

          {apiError ? (
            <ThemedText className="text-red-500 dark:text-red-400 text-sm mb-4">{apiError}</ThemedText>
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
