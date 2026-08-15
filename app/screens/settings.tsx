import { View } from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';

export default function SettingsScreen() {
  const { t } = useTranslation();

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
            title={t('settingsCommunicationPrefs')}
            description={t('settingsCommunicationPrefsDesc')}
            icon="MessagesSquare"
            href="/screens/communication-settings"
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
      </ThemedScroller>
    </AnimatedView>
  );
}
