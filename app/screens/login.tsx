import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import { loginWithPhone } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';

type LoginMode = 'email' | 'phone';

const COUNTRY_CODE_OPTIONS = [
  { value: '+420', label: '🇨🇿 +420' },
  { value: '+421', label: '🇸🇰 +421' },
  { value: '+48', label: '🇵🇱 +48' },
  { value: '+49', label: '🇩🇪 +49' },
  { value: '+43', label: '🇦🇹 +43' },
  { value: '+33', label: '🇫🇷 +33' },
  { value: '+39', label: '🇮🇹 +39' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+31', label: '🇳🇱 +31' },
  { value: '+32', label: '🇧🇪 +32' },
  { value: '+41', label: '🇨🇭 +41' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+36', label: '🇭🇺 +36' },
  { value: '+30', label: '🇬🇷 +30' },
  { value: '+351', label: '🇵🇹 +351' },
  { value: '+353', label: '🇮🇪 +353' },
  { value: '+45', label: '🇩🇰 +45' },
  { value: '+46', label: '🇸🇪 +46' },
  { value: '+47', label: '🇳🇴 +47' },
  { value: '+358', label: '🇫🇮 +358' },
  { value: '+7', label: '🇷🇺 +7' },
  { value: '+380', label: '🇺🇦 +380' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+55', label: '🇧🇷 +55' },
  { value: '+54', label: '🇦🇷 +54' },
  { value: '+56', label: '🇨🇱 +56' },
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+58', label: '🇻🇪 +58' },
  { value: '+51', label: '🇵🇪 +51' },
  { value: '+90', label: '🇹🇷 +90' },
  { value: '+972', label: '🇮🇱 +972' },
  { value: '+971', label: '🇦🇪 +971' },
  { value: '+20', label: '🇪🇬 +20' },
  { value: '+27', label: '🇿🇦 +27' },
  { value: '+91', label: '🇮🇳 +91' },
  { value: '+86', label: '🇨🇳 +86' },
  { value: '+81', label: '🇯🇵 +81' },
  { value: '+82', label: '🇰🇷 +82' },
  { value: '+60', label: '🇲🇾 +60' },
  { value: '+65', label: '🇸🇬 +65' },
  { value: '+66', label: '🇹🇭 +66' },
  { value: '+84', label: '🇻🇳 +84' },
  { value: '+61', label: '🇦🇺 +61' },
  { value: '+64', label: '🇳🇿 +64' },
  { value: '+234', label: '🇳🇬 +234' },
  { value: '+254', label: '🇰🇪 +254' },
  { value: '+212', label: '🇲🇦 +212' },
];

function formatPhoneDisplay(text: string): string {
  const cleaned = text.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
  if (match) return [match[1], match[2], match[3]].filter(Boolean).join(' ');
  return text;
}

export default function LoginScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { setAuth } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>(mode === 'phone' ? 'phone' : 'email');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+420');
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
    if (loginMode === 'phone') {
      const phoneOk = validatePhone(phone);
      const passwordOk = validatePassword(password);
      if (!phoneOk || !passwordOk) return;
      setIsLoading(true);
      try {
        const digitsOnly = phone.replace(/\D/g, '');
        const fullPhone = `${countryCode}${digitsOnly}`;
        const data = await loginWithPhone(fullPhone, password);
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
            <View className="mb-4">
              <ThemedText className="mb-1 font-medium text-light-text dark:text-dark-text">Telefonní číslo</ThemedText>
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
