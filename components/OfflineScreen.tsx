import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

const LOGO_LIGHT = require('@/assets/img/wallet/realbarber-light.png');
const LOGO_DARK = require('@/assets/img/wallet/realbarber-dark.png');

interface OfflineScreenProps {
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
}

export default function OfflineScreen({ onRetry, retrying = false }: OfflineScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const logoSource = isDark ? LOGO_DARK : LOGO_LIGHT;
  const logoWidth = useMemo(() => 220, []);

  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  return (
    <View
      className="flex-1 bg-light-primary px-global dark:bg-dark-primary"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View className="flex-1 items-center justify-center">
        <Image
          source={logoSource}
          style={{ width: logoWidth, height: Math.round(logoWidth * 0.38), marginBottom: 32 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <ThemedText className="max-w-sm text-center text-lg font-semibold leading-snug">
          {t('offlineTitle')}
        </ThemedText>
        <ThemedText className="mt-3 max-w-sm text-center text-base text-light-subtext dark:text-dark-subtext">
          {t('offlineSubtitle')}
        </ThemedText>
      </View>

      <Button
        title={t('offlineRetry')}
        onPress={handleRetry}
        disabled={retrying}
        size="large"
        rounded="xl"
      />
    </View>
  );
}