import { View, Pressable, Text } from 'react-native';

import { useLanguage } from '@/app/contexts/LanguageContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';

const SWITCH_LABEL_CZ = 'Přepnout do češtiny';
const SWITCH_LABEL_EN = 'Switch to English';
const FLAG_CZ = '🇨🇿';
const FLAG_EN = '🇬🇧';

export default function SettingsScreen() {
  const { locale, toggleLocale } = useLanguage();
  const { t } = useTranslation();

  const isEnglish = locale === 'en';
  const switchLabel = isEnglish ? SWITCH_LABEL_CZ : SWITCH_LABEL_EN;
  const switchFlag = isEnglish ? FLAG_CZ : FLAG_EN;

  return (
    <AnimatedView
      className="flex-1 bg-light-primary dark:bg-dark-primary"
      animation="fadeIn"
      duration={350}
      playOnlyOnce={false}>
      <Header showBackButton />
      <ThemedScroller>
        <Section
          titleSize="3xl"
          className="px-4 pb-10 pt-4"
          title={t('settingsTitle')}
          subtitle={t('settingsSubtitle')}
        />

        <View className="px-4">
          <ListLink
            title={t('settingsAccent')}
            description={t('settingsAccentDesc')}
            icon="Palette"
            href="/screens/settings-accent"
          />
          <ListLink
            title={t('settingsCommunicationPrefs')}
            description={t('settingsCommunicationPrefsDesc')}
            icon="MessagesSquare"
            href="/screens/communication-settings"
          />
          <ListLink
            title={t('settingsChangePassword')}
            description={t('settingsChangePasswordDesc')}
            icon="KeyRound"
            href="/screens/change-password"
          />
          <ListLink
            title={t('settingsDeleteAccount')}
            description={t('settingsDeleteAccountSectionDesc')}
            icon="X"
            href="/screens/delete-account"
          />
          <ListLink
            title={t('settingsHelp')}
            description={t('settingsHelpDesc')}
            icon="HelpCircle"
            href="/screens/help"
          />
        </View>

        <View className="items-center justify-center pb-8 pt-6">
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
            <Text className="ml-2 text-base font-medium text-white dark:text-neutral-900">
              {switchLabel}
            </Text>
          </Pressable>
        </View>
      </ThemedScroller>
    </AnimatedView>
  );
}
