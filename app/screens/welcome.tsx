import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ThemeToggle from '@/components/ThemeToggle';
import ThemedText from '@/components/ThemedText';

const SWITCH_LABEL_CZ = 'Přepnout do češtiny';
const SWITCH_LABEL_EN = 'Switch to English';
const FLAG_CZ = '🇨🇿';
const FLAG_EN = '🇬🇧';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { locale, toggleLocale } = useLanguage();
  const { t } = useTranslation();

  const isEnglish = locale === 'en';
  const switchFlag = isEnglish ? FLAG_CZ : FLAG_EN;

  return (
    <SafeAreaView
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 bg-light-primary dark:bg-dark-primary">
      <View className="relative flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="w-full flex-row items-center justify-between px-4 pt-2">
          <Pressable
            onPress={toggleLocale}
            className="flex-row items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 dark:border-neutral-600">
            <Text style={{ fontSize: 14 }}>{switchFlag}</Text>
            <Text className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {isEnglish ? 'CZ' : 'EN'}
            </Text>
          </Pressable>
          <ThemeToggle />
        </View>

        <View className="flex w-full flex-1 flex-col items-start justify-end gap-2 px-global pb-4">
          <View className="mb-8">
            <ThemedText className="text-4xl font-bold">{t('loginWelcomeBack')}</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              {t('welcomeSubtitle')}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/screens/login')}
            className="flex w-full flex-row items-center justify-center rounded-2xl border border-black py-4 dark:border-white">
            <ThemedText className="text-base font-medium">{t('welcomeStart')}</ThemedText>
          </Pressable>
          <Image
            source={require('@/assets/img/welcomerb.png')}
            style={{ width: '100%', height: 320, marginBottom: -110 }}
            contentFit="contain"
            pointerEvents="none"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
