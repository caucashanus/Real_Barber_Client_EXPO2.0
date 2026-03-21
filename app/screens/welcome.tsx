import { View, Text, Pressable } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemeToggle from '@/components/ThemeToggle';
import { AntDesign } from '@expo/vector-icons';
import useThemeColors from '../contexts/ThemeColors';
import { router } from 'expo-router';
import React from 'react';
import Icon from '@/components/Icon';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';

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
        <SafeAreaView style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} className='flex-1 bg-light-primary dark:bg-dark-primary'>

            <View className="flex-1 relative bg-light-primary dark:bg-dark-primary">
                <View className='w-full flex-row justify-end items-center px-4 pt-2'>
                    <ThemeToggle />
                </View>

                <View className='flex flex-col items-start w-full justify-center gap-2 flex-1 px-global pb-4'>
                    <View className='mb-8'>
                        <ThemedText className='text-4xl font-bold'>{t('loginWelcomeBack')}</ThemedText>
                        <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('welcomeSubtitle')}</ThemedText>
                    </View>
                    <Pressable onPress={() => router.push('/screens/login')} className='w-full border border-black dark:border-white rounded-2xl flex flex-row items-center justify-center py-4'>
                        <View className='absolute left-4 top-4.5'>
                            <Icon name="ArrowRight" size={20} color={colors.text} />
                        </View>
                        <ThemedText className='text-base font-medium pr-2'>{t('welcomeStart')}</ThemedText>
                    </Pressable>
                    {SHOW_WELCOME_GOOGLE_APPLE_BUTTONS ? (
                        <>
                            <Pressable onPress={() => router.push('/(tabs)/(home)')} className='w-full border border-black dark:border-white rounded-2xl flex flex-row items-center justify-center py-4'>
                                <View className='absolute left-4 top-4.5'>
                                    <AntDesign name="google" size={22} color={colors.text} />
                                </View>
                                <ThemedText className='text-base font-medium pr-2'>{t('welcomeContinueGoogle')}</ThemedText>
                            </Pressable>
                            <Pressable onPress={() => router.push('/(tabs)/(home)')} className='w-full border border-black dark:border-white rounded-2xl flex flex-row items-center justify-center py-4'>
                                <View className='absolute left-4 top-4.5'>
                                    <AntDesign name="apple" size={22} color={colors.text} />
                                </View>
                                <ThemedText className='text-base font-medium pr-2'>{t('welcomeContinueApple')}</ThemedText>
                            </Pressable>
                        </>
                    ) : null}
                </View>

                <View className='items-center justify-center pb-8 pt-2 px-4'>
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
                        className='bg-neutral-900 dark:bg-neutral-100 rounded-full py-3 px-6 min-w-[220px]'
                    >
                        <Text style={{ fontSize: 16 }}>{switchFlag}</Text>
                        <Text className='text-white text-base font-medium dark:text-neutral-900 ml-2' numberOfLines={1}>
                            {switchLabel}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
