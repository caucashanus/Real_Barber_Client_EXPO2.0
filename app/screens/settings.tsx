import { View, Pressable, Text } from 'react-native';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import AnimatedView from '@/components/AnimatedView';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';

/** Text v cílovém jazyce: v EN verzi zobrazit česky, v ČJ verzi anglicky. */
const SWITCH_LABEL_CZ = 'Přepnout do češtiny';
const SWITCH_LABEL_EN = 'Switch to English';
const FLAG_CZ = '🇨🇿';
const FLAG_EN = '🇬🇧';

/** Nastavení → Platby (→ `/screens/profile/payments`). Nastav na `true`, až bude sekce znovu potřeba. */
const SHOW_SETTINGS_PAYMENTS_SECTION = false;

/** Nastavení → Měna (`/screens/profile/currency`). Nastav na `true`, až bude znovu potřeba. */
const SHOW_SETTINGS_CURRENCY_SECTION = false;

/** Nastavení → Nápověda (`/screens/help`). Nastav na `true`, až bude znovu potřeba. */
const SHOW_SETTINGS_HELP_SECTION = false;

/** Nastavení → Oznámení (`/screens/profile/notifications`). Nastav na `true`, až bude znovu potřeba. */
const SHOW_SETTINGS_NOTIFICATIONS_SECTION = false;

export default function SettingsScreen() {
    const { locale, toggleLocale } = useLanguage();
    const { t } = useTranslation();

    const isEnglish = locale === 'en';
    const switchLabel = isEnglish ? SWITCH_LABEL_CZ : SWITCH_LABEL_EN;
    const switchFlag = isEnglish ? FLAG_CZ : FLAG_EN;

    return (
        <AnimatedView className='flex-1 bg-light-primary dark:bg-dark-primary' animation='fadeIn' duration={350} playOnlyOnce={false}>
            <Header showBackButton />
            <ThemedScroller>
                <Section titleSize='3xl' className='pt-4 pb-10 px-4' title={t('settingsTitle')} subtitle={t('settingsSubtitle')} />

                <View className='px-4'>
                    <ListLink title={t('settingsAccent')} description={t('settingsAccentDesc')} icon="Palette" href="/screens/settings-accent" />
                    <ListLink
                        title={t('settingsCommunicationPrefs')}
                        description={t('settingsCommunicationPrefsDesc')}
                        icon="MessagesSquare"
                        href="/screens/communication-settings"
                    />
                    {SHOW_SETTINGS_PAYMENTS_SECTION ? (
                        <ListLink title={t('settingsPayments')} description={t('settingsPaymentsDesc')} icon="CreditCard" href="/screens/profile/payments" />
                    ) : null}
                    {SHOW_SETTINGS_NOTIFICATIONS_SECTION ? (
                        <ListLink title={t('settingsNotifications')} description={t('settingsNotificationsDesc')} icon="Bell" href="/screens/profile/notifications" />
                    ) : null}
                    {SHOW_SETTINGS_CURRENCY_SECTION ? (
                        <ListLink title={t('settingsCurrency')} description={t('settingsCurrencyDesc')} icon="DollarSign" href="/screens/profile/currency" />
                    ) : null}
                    <ListLink title={t('settingsChangePassword')} description={t('settingsChangePasswordDesc')} icon="KeyRound" href="/screens/change-password" />
                    {SHOW_SETTINGS_HELP_SECTION ? (
                        <ListLink title={t('settingsHelp')} description={t('settingsHelpDesc')} icon="HelpCircle" href="/screens/help" />
                    ) : null}
                </View>

                <View className='items-center justify-center pb-8 pt-6'>
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
                        <Text className='text-white text-base font-medium dark:text-neutral-900 ml-2'>
                            {switchLabel}
                        </Text>
                    </Pressable>
                </View>
            </ThemedScroller>
        </AnimatedView>
    );
}