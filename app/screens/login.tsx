import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

import { requestClientOtp } from '@/api/auth';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import PhoneInput from '@/components/forms/PhoneInput';
import AuthScreenLayout from '@/components/layout/AuthScreenLayout';
import { buildFullPhone, validatePhoneDigits } from '@/utils/phone';

function ShimmerButton({ children }: { children: React.ReactNode }) {
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: 2,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerX]);

  const translateX = shimmerX.interpolate({
    inputRange: [-1, 2],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.shimmerContainer}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    marginBottom: 24,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  shimmerGradient: {
    flex: 1,
    width: 120,
  },
});

export default function LoginScreen() {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState('+420');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setLoading] = useState(false);

  const handleContinue = async () => {
    setApiError('');
    const validation = validatePhoneDigits(phone);
    if (!validation.valid) {
      setPhoneError(t(validation.errorKey!));
      return;
    }
    setPhoneError('');

    setLoading(true);
    try {
      const fullPhone = buildFullPhone(countryCode, phone);
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
      <AuthScreenLayout bottomImage={require('@/assets/img/loginrb.png')}>
        <View className="mt-8">
          <ThemedText className="mb-1 text-3xl font-bold">{t('loginWelcomeBack')}</ThemedText>
          <ThemedText className="mb-6 text-light-subtext dark:text-dark-subtext">
            {t('loginPhoneStepSubtitle')}
          </ThemedText>

          <PhoneInput
            label={t('signupPhoneLabel')}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            phone={phone}
            onPhoneChange={setPhone}
            error={phoneError}
            onValidate={(result) => {
              if (result.valid) setPhoneError('');
              else if (result.errorKey) setPhoneError(t(result.errorKey));
            }}
          />

          {apiError ? (
            <ThemedText className="mb-4 text-sm text-red-500 dark:text-red-400">
              {apiError}
            </ThemedText>
          ) : null}

          <ShimmerButton>
            <Button
              title={t('loginContinue')}
              onPress={() => void handleContinue()}
              loading={isLoading}
              size="large"
              textClassName="font-bold text-lg"
            />
          </ShimmerButton>
        </View>
      </AuthScreenLayout>
    </>
  );
}
