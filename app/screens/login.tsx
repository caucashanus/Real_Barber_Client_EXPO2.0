import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import { loginWithPhone } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';
import { COUNTRY_CODE_OPTIONS, formatPhoneDisplay } from '@/utils/phone';

export default function LoginScreen() {
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

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
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
      setApiError(e instanceof Error ? e.message : 'Přihlášení se nezdařilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showBackButton />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
        <View className="mt-8">
          <ThemedText className="text-3xl font-bold mb-1">Welcome back</ThemedText>
          <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
            Sign in to your account
          </ThemedText>

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

          <Input
            label="Password"
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

          <Link className="underline text-black dark:text-white text-sm mb-4" href="/screens/forgot-password">
            Forgot Password?
          </Link>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            size="large"
            className="mb-6"
          />

          <View className="flex-row justify-center">
            <ThemedText className="text-light-subtext dark:text-dark-subtext">Don't have an account? </ThemedText>
            <Link href="/screens/signup" asChild>
              <Pressable>
                <ThemedText className="underline">Sign up</ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </>
  );
}
