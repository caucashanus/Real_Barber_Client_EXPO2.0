import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import { getStoreUpdateUrl } from '@/constants/appVersionPolicy';
import { useTranslation } from '@/hooks/useTranslation';

export default function ForceUpdateScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const openStore = useCallback(() => {
    const platform = Platform.OS === 'android' ? 'android' : 'ios';
    void Linking.openURL(getStoreUpdateUrl(platform)).catch(() => {});
  }, []);

  return (
    <View
      className="flex-1 bg-light-primary px-global dark:bg-dark-primary"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View className="flex-1 items-center justify-center">
        <Image
          source={require('@/assets/icon.png')}
          style={{ width: 88, height: 88, borderRadius: 20, marginBottom: 32 }}
          contentFit="cover"
        />
        <ThemedText className="mb-4 text-center text-2xl font-semibold">
          {t('forceUpdateTitle')}
        </ThemedText>
        <ThemedText className="max-w-sm text-center text-base text-light-subtext dark:text-dark-subtext">
          {t('forceUpdateMessage')}
        </ThemedText>
      </View>

      <Button title={t('forceUpdateButton')} onPress={openStore} size="large" rounded="xl" />
    </View>
  );
}
