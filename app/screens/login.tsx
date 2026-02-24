import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import { loginWithPhone } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';

type LoginMode = 'email' | 'phone';

export default function LoginScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { setAuth } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>(mode === 'phone' ? 'phone' : 'email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === 'phone') setLoginMode('phone');
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
    const trimmed = value.trim();
    if (!trimmed) {
      setPhoneError('Telefon je povinný');
      return false;
    }
    if (trimmed.length < 9) {
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
    if (loginMode === 'phone') {
      const phoneOk = validatePhone(phone);
      const passwordOk = validatePassword(password);
      if (!phoneOk || !passwordOk) return;
      setIsLoading(true);
      try {
        const data = await loginWithPhone(phone, password);
        await setAuth(data.token, data.apiToken, data.client);
        router.replace('/(tabs)/(home)');
      } catch (e) {
        setApiError(e instanceof Error ? e.message : 'Přihlášení se nezdařilo');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);
    if (emailOk && passwordOk) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/(tabs)/(home)');
      }, 1500);
    }
  };

  return (
    <>
      <Header showBackButton />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
        <View className="mt-8">
          <ThemedText className="text-3xl font-bold mb-1">Welcome back</ThemedText>
          <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">Sign in to your account</ThemedText>

          <View className="flex-row gap-2 mb-6">
            <Pressable
              onPress={() => setLoginMode('email')}
              className={`flex-1 py-3 rounded-xl border ${loginMode === 'email' ? 'border-black dark:border-white bg-light-secondary dark:bg-dark-secondary' : 'border-light-secondary dark:border-dark-secondary'}`}
            >
              <ThemedText className="text-center font-medium">Email</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setLoginMode('phone')}
              className={`flex-1 py-3 rounded-xl border ${loginMode === 'phone' ? 'border-black dark:border-white bg-light-secondary dark:bg-dark-secondary' : 'border-light-secondary dark:border-dark-secondary'}`}
            >
              <ThemedText className="text-center font-medium">Pomocí tel. čísla</ThemedText>
            </Pressable>
          </View>

          {loginMode === 'email' ? (
            <Input
              label="Email"
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
            <Input
              label="Telefon"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (phoneError) validatePhone(text);
              }}
              error={phoneError}
              keyboardType="phone-pad"
              placeholder="+420 774 522 114"
              autoComplete="tel"
              containerClassName="mb-4"
            />
          )}

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

          {loginMode === 'email' ? (
            <Link className="underline text-black dark:text-white text-sm mb-4" href="/screens/forgot-password">
              Forgot Password?
            </Link>
          ) : null}

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
