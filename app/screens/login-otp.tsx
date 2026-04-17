import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  TextInput,
  StyleSheet,
} from 'react-native';

import { requestClientOtp, verifyClientOtp } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/app/contexts/ThemeContext';

const OTP_LENGTH = 6;

function paramString(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

function OtpInput({
  value,
  onChange,
  error,
  onComplete,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  onComplete: (val: string) => void;
}) {
  const { isDark } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '');

    // Handle paste — if more than 1 char, fill all boxes
    if (sanitized.length > 1) {
      const newVal = sanitized.slice(0, OTP_LENGTH);
      onChange(newVal);
      const nextIndex = Math.min(newVal.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      if (newVal.length === OTP_LENGTH) onComplete(newVal);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = sanitized;
    const newVal = newDigits.join('').slice(0, OTP_LENGTH);
    onChange(newVal);

    if (sanitized && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newVal.length === OTP_LENGTH) onComplete(newVal);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      onChange(newDigits.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const borderColor = error
    ? '#ef4444'
    : isDark
      ? '#404040'
      : '#E2E8F0';

  const focusedBorderColor = isDark ? '#ffffff' : '#000000';
  const textColor = isDark ? '#ffffff' : '#000000';
  const bgColor = isDark ? '#262626' : '#F5F5F5';

  return (
    <View>
      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            selectTextOnFocus
            style={[
              styles.otpBox,
              {
                borderColor: digit ? focusedBorderColor : borderColor,
                color: textColor,
                backgroundColor: bgColor,
              },
            ]}
          />
        ))}
      </View>
      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
  },
});

export default function LoginOtpScreen() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();
  const params = useLocalSearchParams<{
    phone?: string | string[];
    displayName?: string | string[];
    expiresIn?: string | string[];
    requiresRegistration?: string | string[];
  }>();

  const phone = paramString(params.phone);
  const displayNameFromParams = paramString(params.displayName).trim();

  const [welcomeName, setWelcomeName] = useState(displayNameFromParams);

  const initialExpires = useMemo(() => {
    const raw = paramString(params.expiresIn);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 600;
  }, [params.expiresIn]);

  const [expiresSec, setExpiresSec] = useState(initialExpires);

  useEffect(() => { setExpiresSec(initialExpires); }, [initialExpires]);
  useEffect(() => { setWelcomeName(displayNameFromParams); }, [displayNameFromParams]);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(30);

  useEffect(() => {
    if (!phone) router.replace('/screens/login');
  }, [phone]);

  useEffect(() => {
    setResendCooldownSec(30);
  }, [phone]);

  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const id = setInterval(() => {
      setResendCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldownSec]);

  const minutesLabel = Math.max(1, Math.ceil(expiresSec / 60));

  const validateOtp = (value: string) => {
    const d = value.replace(/\D/g, '');
    if (d.length !== 6) {
      setOtpError(t('loginOtpInvalid'));
      return false;
    }
    setOtpError('');
    return true;
  };

  const handleVerify = async (otpValue?: string) => {
    const code = (otpValue ?? otp).replace(/\D/g, '');
    setApiError('');
    if (code.length !== 6) {
      setOtpError(t('loginOtpInvalid'));
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const digits = code;
      const data = await verifyClientOtp(phone, digits);
      if ('requiresRegistration' in data && data.requiresRegistration === true) {
        if (!data.registrationToken) {
          setApiError(t('signupRegisterFailed'));
          return;
        }
        router.replace({
          pathname: '/screens/signup',
          params: { phone, registrationToken: data.registrationToken },
        });
        return;
      }
      await setAuth(data.token, data.apiToken, data.client);
      router.replace('/(tabs)/(home)');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('loginOtpFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setApiError('');
    setResendLoading(true);
    try {
      const data = await requestClientOtp(phone);
      if (!data.exists || !data.challengeSent) {
        setApiError(t('loginOtpChallengeNotSent'));
        return;
      }
      setExpiresSec(data.expiresInSeconds ?? 600);
      if (data.exists && data.displayName?.trim()) {
        setWelcomeName(data.displayName.trim());
      }
      setOtp('');
      setOtpError('');
      setResendCooldownSec(30);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('loginOtpRequestFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <>
      <Header showBackButton />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-light-primary dark:bg-dark-primary" style={{ overflow: 'hidden' }}>
          <View className="p-6">
            <View className="mt-8">
              <ThemedText className="mb-3 text-3xl font-bold text-light-text dark:text-dark-text">
                {welcomeName
                  ? t('loginOtpGreetingWithName').replace('{name}', welcomeName)
                  : t('loginOtpGreetingNoName')}
              </ThemedText>
              <ThemedText className="mb-8 text-light-subtext dark:text-dark-subtext">
                {t('loginOtpSubtitle').replace('{minutes}', String(minutesLabel))}
              </ThemedText>

              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (otpError) validateOtp(val);
                }}
                error={otpError}
                onComplete={(val) => void handleVerify(val)}
              />

              {apiError ? (
                <ThemedText className="mb-4 mt-2 text-sm text-red-500 dark:text-red-400">
                  {apiError}
                </ThemedText>
              ) : null}

              <Button
                title={t('loginOtpVerify')}
                onPress={() => void handleVerify(undefined)}
                loading={loading}
                size="large"
                className="mb-4 mt-6"
                textClassName="font-bold text-lg"
              />

              <Button
                title={
                  resendCooldownSec > 0
                    ? `${t('loginOtpResend')} (${resendCooldownSec}s)`
                    : t('loginOtpResend')
                }
                onPress={() => void handleResend()}
                loading={resendLoading}
                disabled={loading || resendLoading || resendCooldownSec > 0}
                variant="secondary"
                size="large"
                className="mb-6"
              />

              <Pressable onPress={() => router.replace('/screens/login')} className="self-center">
                <ThemedText className="text-center text-light-subtext underline dark:text-dark-subtext">
                  {t('loginOtpChangePhone')}
                </ThemedText>
              </Pressable>
            </View>
          </View>
          <Image
            source={require('@/assets/img/smslogin.png')}
            style={{ width: '100%', height: 320, position: 'absolute', bottom: 0 }}
            resizeMode="contain"
          />
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}
