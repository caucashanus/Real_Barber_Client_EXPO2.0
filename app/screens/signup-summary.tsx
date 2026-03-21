import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';

export default function SignupSummaryScreen() {
  const { client, isLoading } = useAuth();
  const colors = useThemeColors();
  const { t } = useTranslation();

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
    raw.length > 0 && (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('file:'));

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
        <View className="flex-1 px-global justify-between py-8">
          <View className="flex-1 justify-center items-center">
            <View
              className="rounded-full overflow-hidden border-4 border-light-secondary dark:border-dark-secondary bg-light-secondary dark:bg-dark-secondary mb-8"
              style={{ width: 160, height: 160 }}
            >
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
                    className="text-light-subtext dark:text-dark-subtext opacity-60"
                  />
                </View>
              )}
            </View>

            <ThemedText className="text-2xl font-bold text-light-text dark:text-dark-text text-center px-4">
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
      </SafeAreaView>
    </>
  );
}
