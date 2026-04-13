import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

const REGISTRATION_SUMMARY_LOTTIE = require('@/assets/lottie/registrationsummary.json');

export default function SignupSummaryScreen() {
  const { client, isLoading } = useAuth();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { width: winW, height: winH } = useWindowDimensions();

  useEffect(() => {
    if (!isLoading && !client) {
      router.replace('/screens/login');
    }
  }, [isLoading, client]);

  if (isLoading || !client) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator />
      </View>
    );
  }

  const raw = client.avatarUrl?.trim() ?? '';
  const showAvatar =
    raw.length > 0 &&
    (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('file:'));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <SafeAreaView className="flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="flex-1">
          <View
            pointerEvents="none"
            className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-light-primary dark:bg-dark-primary"
            style={{ zIndex: 0 }}>
            <LottieView
              source={REGISTRATION_SUMMARY_LOTTIE}
              autoPlay
              loop
              resizeMode="cover"
              style={{ width: winW, height: winH }}
            />
          </View>

          <View className="flex-1 justify-between px-global py-8" style={{ zIndex: 1 }}>
            <View className="flex-1 items-center justify-center">
              <View
                className="mb-8 overflow-hidden rounded-full border-4 border-light-secondary bg-light-secondary dark:border-dark-secondary dark:bg-dark-secondary"
                style={{ width: 160, height: 160 }}>
                {showAvatar ? (
                  <Image
                    source={{ uri: raw }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Icon
                      name="User"
                      size={72}
                      className="text-light-subtext opacity-60 dark:text-dark-subtext"
                    />
                  </View>
                )}
              </View>

              <ThemedText className="px-4 text-center text-2xl font-bold text-light-text dark:text-dark-text">
                {client.name}
              </ThemedText>
            </View>

            <Button
              variant="primary"
              size="large"
              rounded="full"
              title={t('signupWelcomeJoinTeam')}
              onPress={() => router.replace('/(tabs)/(home)')}
              className="w-full"
              textClassName="text-white font-semibold"
              style={{ backgroundColor: colors.highlight }}
              impactFeedbackStyle={Haptics.ImpactFeedbackStyle.Heavy}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
