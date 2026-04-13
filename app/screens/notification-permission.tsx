import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

export default function NotificationPermissionScreen() {
  const { t } = useTranslation();
  const handleSkip = () => {
    router.replace('/screens/location-permission');
  };

  return (
    <View className="flex-1 bg-light-primary p-6 dark:bg-dark-primary">
      <View className="flex-1 items-center justify-center">
        <Icon name="BellDot" size={80} strokeWidth={0.7} />
        <ThemedText className="mb-4 mt-8 text-center text-3xl font-bold">
          {t('permissionAllowNotifications')}
        </ThemedText>
        <ThemedText className="mb-12 text-center text-light-subtext dark:text-dark-subtext">
          Stay updated with property alerts, messages, and important updates
        </ThemedText>
      </View>

      <View className="gap-1">
        <Button title={t('permissionAllowNotifications')} size="large" />
        <Button
          title={t('permissionSkipForNow')}
          onPress={handleSkip}
          variant="ghost"
          size="large"
        />
      </View>
    </View>
  );
}
