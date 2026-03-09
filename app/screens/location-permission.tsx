import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useTranslation } from '@/app/hooks/useTranslation';

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
    <View className="flex-1 bg-light-primary dark:bg-dark-primary p-6">
      <View className="flex-1 items-center justify-center">
      <Icon name="MapPinned" size={80} strokeWidth={0.7} />
        <ThemedText className="text-3xl font-bold text-center mb-4 mt-8">
          {t('permissionAllowLocation')}
        </ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext text-center mb-12">
          Allow access to your location to find nearby properties and get accurate recommendations
        </ThemedText>
      </View>
      
      <View className="gap-4">
        <Button
          title={t('permissionAllowLocation')}
          onPress={handleAllowLocation}
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