import * as Location from 'expo-location';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

export default function LocationPermissionScreen() {
  const { t } = useTranslation();
  const handleAllowLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      router.push('/(drawer)/(tabs)/');
    }
  };

  const handleSkip = () => {
    router.push('/(drawer)/(tabs)/');
  };

  return (
    <View className="flex-1 bg-light-primary p-6 dark:bg-dark-primary">
      <View className="flex-1 items-center justify-center">
        <Icon name="MapPinned" size={80} strokeWidth={0.7} />
        <ThemedText className="mb-4 mt-8 text-center text-3xl font-bold">
          {t('permissionAllowLocation')}
        </ThemedText>
        <ThemedText className="mb-12 text-center text-light-subtext dark:text-dark-subtext">
          Allow access to your location to find nearby properties and get accurate recommendations
        </ThemedText>
      </View>

      <View className="gap-4">
        <Button title={t('permissionAllowLocation')} onPress={handleAllowLocation} size="large" />
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
