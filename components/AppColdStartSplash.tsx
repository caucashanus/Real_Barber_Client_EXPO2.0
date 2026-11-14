import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

const SPLASH_ICON_ASSET = require('@/assets/img/splash-mascot.png');
const LOGO_LIGHT = require('@/assets/img/wallet/realbarber-light.png');
const LOGO_DARK = require('@/assets/img/wallet/realbarber-dark.png');

/** Brand cold start — maskot uprostřed, logo dole (Laza layout). */
export default function AppColdStartSplash() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { t } = useTranslation();

  const logoSource = isDark ? LOGO_DARK : LOGO_LIGHT;
  const iconSize = useMemo(
    () => Math.round(Math.min(screenWidth * 0.64, screenHeight * 0.38, 330)),
    [screenHeight, screenWidth]
  );
  const logoWidth = useMemo(() => Math.min(screenWidth * 0.52, 240), [screenWidth]);

  return (
    <View
      className="flex-1 bg-light-primary dark:bg-dark-primary"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={t('commonLoading')}
      accessibilityLiveRegion="polite">
      <View className="flex-1 items-center justify-center">
        <Image
          source={SPLASH_ICON_ASSET}
          style={{ width: iconSize, height: iconSize, transform: [{ translateY: 44 }] }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <View
        className="w-full items-center"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 20 }}>
        <Image
          source={logoSource}
          style={{ width: logoWidth, height: Math.round(logoWidth * 0.38) }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}