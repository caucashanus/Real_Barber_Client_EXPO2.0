import React, { useState } from 'react';
import { View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';

import { loginWithPhone } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';

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

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      setPasswordError(t('signupPasswordRequired'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    setApiError('');
    const phoneOk = validatePhone(phone);
    const passwordOk = validatePassword(password);
    if (!phoneOk || !passwordOk) return;

    setLoading(true);
    try {
      const digitsOnly = phone.replace(/\D/g, '');
      const fullPhone = `${countryCode}${digitsOnly}`;
      const data = await loginWithPhone(fullPhone, password);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
          <View className="mt-8">
            <ThemedText className="text-3xl font-bold mb-1">{t('loginWelcomeBack')}</ThemedText>
            <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
              {t('loginSubtitle')}
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

            <Input
              label={t('loginPassword')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) validatePassword(text);
              }}
              error={passwordError}
              isPassword
              autoCapitalize="none"
              containerClassName="mb-4"
            />

            {apiError ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mb-4">{apiError}</ThemedText>
            ) : null}

            <Button
              title={t('loginTitle')}
              onPress={() => void handleLogin()}
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
