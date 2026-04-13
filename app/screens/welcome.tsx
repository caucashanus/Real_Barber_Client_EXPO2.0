import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import useThemeColors from '../contexts/ThemeColors';

import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Icon from '@/components/Icon';
import ThemeToggle from '@/components/ThemeToggle';
import ThemedText from '@/components/ThemedText';

/** Stejná logika jako na Nastavení: v cílovém jazyce zobrazit štítek pro přepnutí na druhý jazyk. */
const SWITCH_LABEL_CZ = 'Přepnout do češtiny';
const SWITCH_LABEL_EN = 'Switch to English';
const FLAG_CZ = '🇨🇿';
const FLAG_EN = '🇬🇧';

/** Welcome: tlačítka Google / Apple (mock → `/(tabs)/(home)`). Nastav na `true`, až bude znovu potřeba. */
const SHOW_WELCOME_GOOGLE_APPLE_BUTTONS = false;

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { locale, toggleLocale } = useLanguage();
  const { t } = useTranslation();

  const isEnglish = locale === 'en';
  const switchLabel = isEnglish ? SWITCH_LABEL_CZ : SWITCH_LABEL_EN;
  const switchFlag = isEnglish ? FLAG_CZ : FLAG_EN;

  return (
    <SafeAreaView
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 bg-light-primary dark:bg-dark-primary">
      <View className="relative flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="w-full flex-row items-center justify-end px-4 pt-2">
          <ThemeToggle />
        </View>

        <View className="flex w-full flex-1 flex-col items-start justify-center gap-2 px-global pb-4">
          <View className="mb-8">
            <ThemedText className="text-4xl font-bold">{t('loginWelcomeBack')}</ThemedText>
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              {t('welcomeSubtitle')}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/screens/login')}
            className="flex w-full flex-row items-center justify-center rounded-2xl border border-black py-4 dark:border-white">
            <View className="top-4.5 absolute left-4">
              <Icon name="ArrowRight" size={20} color={colors.text} />
            </View>
            <ThemedText className="pr-2 text-base font-medium">{t('welcomeStart')}</ThemedText>
          </Pressable>
          {SHOW_WELCOME_GOOGLE_APPLE_BUTTONS ? (
            <>
              <Pressable
                onPress={() => router.push('/(tabs)/(home)')}
                className="flex w-full flex-row items-center justify-center rounded-2xl border border-black py-4 dark:border-white">
                <View className="top-4.5 absolute left-4">
                  <AntDesign name="google" size={22} color={colors.text} />
                </View>
                <ThemedText className="pr-2 text-base font-medium">
                  {t('welcomeContinueGoogle')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/(home)')}
                className="flex w-full flex-row items-center justify-center rounded-2xl border border-black py-4 dark:border-white">
                <View className="top-4.5 absolute left-4">
                  <AntDesign name="apple" size={22} color={colors.text} />
                </View>
                <ThemedText className="pr-2 text-base font-medium">
                  {t('welcomeContinueApple')}
                </ThemedText>
              </Pressable>
            </>
          ) : null}
        </View>

        <View className="items-center justify-center px-4 pb-8 pt-2">
          <Pressable
            onPress={toggleLocale}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 3.84,
              elevation: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="min-w-[220px] rounded-full bg-neutral-900 px-6 py-3 dark:bg-neutral-100">
            <Text style={{ fontSize: 16 }}>{switchFlag}</Text>
            <Text
              className="ml-2 text-base font-medium text-white dark:text-neutral-900"
              numberOfLines={1}>
              {switchLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
