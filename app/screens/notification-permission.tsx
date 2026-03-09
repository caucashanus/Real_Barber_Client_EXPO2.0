import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function NotificationPermissionScreen() {
  const { t } = useTranslation();
  const handleSkip = () => {
    router.replace('/screens/location-permission');
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
      <View className="flex-1 items-center justify-center">
        <Icon name="BellDot" size={80} strokeWidth={0.7} />
        <ThemedText className="text-3xl font-bold text-center mb-4 mt-8">
          {t('permissionAllowNotifications')}
        </ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext text-center mb-12">
          Stay updated with property alerts, messages, and important updates
        </ThemedText>
      </View>
      
      <View className="gap-1">
        <Button
          title={t('permissionAllowNotifications')}
          size="large"
        />
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