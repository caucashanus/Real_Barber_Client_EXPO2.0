import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import type { ThemePreference } from '@/constants/themeAppearance';

const REAL_BARBER_ICON = {
  light: require('@/assets/img/wallet/realbarber-light.png'),
  dark: require('@/assets/img/wallet/realbarber-dark.png'),
} as const;

const PHONE_WIDTH = 76;
const PHONE_HEIGHT = 128;
const SCREEN_RADIUS = 10;
const LOGO_SIZE = 28;

interface ThemeAppearancePhonePreviewProps {
  variant: ThemePreference;
}

function FakeUiBars({ tone }: { tone: 'light' | 'dark' | 'split' }) {
  const lightBar = 'bg-neutral-300';
  const darkBar = 'bg-neutral-600';

  if (tone === 'split') {
    return (
      <View className="mt-2 w-full gap-1 px-2">
        {[0.85, 0.65, 0.75].map((widthRatio, index) => (
          <View key={index} className="h-1 w-full flex-row overflow-hidden rounded-full">
            <View className={`h-full rounded-full ${lightBar}`} style={{ width: `${widthRatio * 50}%` }} />
            <View
              className={`h-full rounded-full ${darkBar}`}
              style={{ width: `${widthRatio * 50}%` }}
            />
          </View>
        ))}
      </View>
    );
  }

  const barClass = tone === 'light' ? lightBar : darkBar;
  return (
    <View className="mt-2 w-full gap-1 px-2">
      {[0.85, 0.65, 0.75].map((widthRatio, index) => (
        <View
          key={index}
          className={`h-1 self-center rounded-full ${barClass}`}
          style={{ width: `${widthRatio * 100}%` }}
        />
      ))}
    </View>
  );
}

function RealBarberLogo({ variant }: { variant: ThemePreference }) {
  if (variant === 'system') {
    return (
      <View
        className="mt-2 flex-row self-center overflow-hidden rounded-sm"
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}>
        <View className="h-full overflow-hidden" style={{ width: LOGO_SIZE / 2 }}>
          <Image
            source={REAL_BARBER_ICON.light}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            contentFit="contain"
          />
        </View>
        <View className="h-full overflow-hidden" style={{ width: LOGO_SIZE / 2 }}>
          <Image
            source={REAL_BARBER_ICON.dark}
            style={{
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              marginLeft: -LOGO_SIZE / 2,
            }}
            contentFit="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={variant === 'dark' ? REAL_BARBER_ICON.dark : REAL_BARBER_ICON.light}
      style={{
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        marginTop: 8,
        alignSelf: 'center',
      }}
      contentFit="contain"
    />
  );
}

function SystemScreen() {
  return (
    <View className="relative flex-1 flex-row overflow-hidden">
      <View className="flex-1 bg-white" />
      <View className="flex-1 bg-dark-primary" />
      <View className="absolute left-0 right-0 top-1.5 items-center">
        <RealBarberLogo variant="system" />
      </View>
      <View className="absolute bottom-2 left-0 right-0">
        <FakeUiBars tone="split" />
      </View>
    </View>
  );
}

function ScreenContent({ variant }: { variant: ThemePreference }) {
  if (variant === 'system') {
    return <SystemScreen />;
  }

  const isDark = variant === 'dark';
  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-primary' : 'bg-white'}`}>
      <RealBarberLogo variant={variant} />
      <FakeUiBars tone={isDark ? 'dark' : 'light'} />
    </View>
  );
}

export default function ThemeAppearancePhonePreview({ variant }: ThemeAppearancePhonePreviewProps) {
  return (
    <View
      className="items-center justify-center rounded-[18px] border border-neutral-300 bg-neutral-800 p-1 dark:border-neutral-600"
      style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}>
      <View
        className="w-full flex-1 overflow-hidden bg-black"
        style={{ borderRadius: SCREEN_RADIUS }}>
        <ScreenContent variant={variant} />
      </View>
    </View>
  );
}
