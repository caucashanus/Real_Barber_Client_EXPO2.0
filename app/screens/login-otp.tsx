import React, { useEffect, useMemo, useState } from 'react';
import { View, Keyboard, TouchableWithoutFeedback, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import { requestClientOtp, verifyClientOtp } from '@/api/auth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';

function paramString(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export default function LoginOtpScreen() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();
  const params = useLocalSearchParams<{ phone?: string | string[]; displayName?: string | string[]; expiresIn?: string | string[] }>();

  const phone = paramString(params.phone);
  const displayNameFromParams = paramString(params.displayName).trim();

  const [welcomeName, setWelcomeName] = useState(displayNameFromParams);

  const initialExpires = useMemo(() => {
    const raw = paramString(params.expiresIn);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 600;
  }, [params.expiresIn]);

  const [expiresSec, setExpiresSec] = useState(initialExpires);

  useEffect(() => {
    setExpiresSec(initialExpires);
  }, [initialExpires]);

  useEffect(() => {
    setWelcomeName(displayNameFromParams);
  }, [displayNameFromParams]);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      router.replace('/screens/login');
    }
  }, [phone]);

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

  const handleVerify = async () => {
    setApiError('');
    if (!validateOtp(otp)) return;
    setLoading(true);
    try {
      const digits = otp.replace(/\D/g, '');
      const data = await verifyClientOtp(phone, digits);
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
    } catch (e) {
      setApiError(e instanceof Error ? e.message : t('loginOtpRequestFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  if (!phone) {
    return null;
  }

  return (
    <>
      <Header showBackButton />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
          <View className="mt-8">
            <ThemedText className="text-3xl font-bold text-light-text dark:text-dark-text mb-3">
              {welcomeName
                ? t('loginOtpGreetingWithName').replace('{name}', welcomeName)
                : t('loginOtpGreetingNoName')}
            </ThemedText>
            <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
              {t('loginOtpSubtitle').replace('{minutes}', String(minutesLabel))}
            </ThemedText>

            <Input
              label={t('loginOtpCodeLabel')}
              value={otp}
              onChangeText={(text) => {
                const next = text.replace(/\D/g, '').slice(0, 6);
                setOtp(next);
                if (otpError) validateOtp(next);
              }}
              error={otpError}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              containerClassName="mb-4"
            />

            {apiError ? (
              <ThemedText className="text-red-500 dark:text-red-400 text-sm mb-4">{apiError}</ThemedText>
            ) : null}

            <Button
              title={t('loginOtpVerify')}
              onPress={() => void handleVerify()}
              loading={loading}
              size="large"
              className="mb-4"
              textClassName="font-bold text-lg"
            />

            <Button
              title={t('loginOtpResend')}
              onPress={() => void handleResend()}
              loading={resendLoading}
              disabled={loading}
              variant="secondary"
              size="large"
              className="mb-6"
            />

            <Pressable onPress={() => router.replace('/screens/login')} className="self-center">
              <ThemedText className="text-center text-light-subtext dark:text-dark-subtext underline">
                {t('loginOtpChangePhone')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}
