import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';

interface ForceUpdateScreenProps {
  storeUrl: string;
}

export default function ForceUpdateScreen({ storeUrl }: ForceUpdateScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const openStore = useCallback(() => {
    void Linking.openURL(storeUrl).catch(() => {});
  }, [storeUrl]);

  return (
    <View
      className="flex-1 bg-black px-global"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <Image
          source={require('@/assets/force-update-mascot.png')}
          style={{ width: 280, height: 328, marginBottom: 28, backgroundColor: 'transparent' }}
          contentFit="contain"
          accessibilityLabel="Real Barber"
        />
        <ThemedText className="mb-4 text-center text-2xl font-semibold text-white">
          {t('forceUpdateTitle')}
        </ThemedText>
        <ThemedText className="max-w-sm text-center text-base text-neutral-400">
          {t('forceUpdateMessage')}
        </ThemedText>
      </View>

      <Button title={t('forceUpdateButton')} onPress={openStore} size="large" rounded="xl" />
    </View>
  );
}
