import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Switch from '@/components/forms/Switch';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { TranslationKey } from '@/locales';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  getCommunicationSettings,
  patchCommunicationSettings,
  type CommunicationChannels,
  type CommunicationContentTypes,
} from '@/api/communication-settings';

const CHANNEL_ROWS: { key: keyof CommunicationChannels; label: TranslationKey }[] = [
  { key: 'phoneCall', label: 'communicationChannel_phoneCall' },
  { key: 'whatsApp', label: 'communicationChannel_whatsApp' },
  { key: 'telegram', label: 'communicationChannel_telegram' },
  { key: 'sms', label: 'communicationChannel_sms' },
  { key: 'email', label: 'communicationChannel_email' },
  { key: 'pushNotification', label: 'communicationChannel_pushNotification' },
];

const CONTENT_ROWS: { key: keyof CommunicationContentTypes; label: TranslationKey }[] = [
  { key: 'newsAndPromotions', label: 'communicationContent_newsAndPromotions' },
  { key: 'favoriteServicesAndProducts', label: 'communicationContent_favoriteServicesAndProducts' },
  { key: 'reviewsAndFeedback', label: 'communicationContent_reviewsAndFeedback' },
  { key: 'satisfactionSurveys', label: 'communicationContent_satisfactionSurveys' },
];

export default function CommunicationSettingsScreen() {
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<CommunicationChannels | null>(null);
  const [contentTypes, setContentTypes] = useState<CommunicationContentTypes | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      setChannels(null);
      setContentTypes(null);
      return;
    }
    setLoading(true);
    setError(null);
    getCommunicationSettings(apiToken)
      .then((res) => {
        setChannels(res.channels);
        setContentTypes(res.contentTypes);
      })
      .catch(() => {
        setError(t('communicationSettingsLoadError'));
        setChannels(null);
        setContentTypes(null);
      })
      .finally(() => setLoading(false));
  }, [apiToken, t]);

  const applyPatch = useCallback(
    async (nextChannels: CommunicationChannels, nextContent: CommunicationContentTypes) => {
      if (!apiToken) throw new Error('Unauthorized');
      try {
        const res = await patchCommunicationSettings(apiToken, {
          channels: nextChannels,
          contentTypes: nextContent,
        });
        setChannels(res.channels);
        setContentTypes(res.contentTypes);
      } catch {
        Alert.alert('', t('communicationSettingsSaveError'));
        throw new Error('Patch failed');
      }
    },
    [apiToken, t]
  );

  const onChannelChange = useCallback(
    async (key: keyof CommunicationChannels, value: boolean) => {
      if (!channels || !contentTypes) return;
      const prevC = { ...channels };
      const nextC = { ...channels, [key]: value };
      setChannels(nextC);
      try {
        await applyPatch(nextC, contentTypes);
      } catch {
        setChannels(prevC);
      }
    },
    [channels, contentTypes, applyPatch]
  );

  const onContentChange = useCallback(
    async (key: keyof CommunicationContentTypes, value: boolean) => {
      if (!channels || !contentTypes) return;
      const prevCt = { ...contentTypes };
      const nextCt = { ...contentTypes, [key]: value };
      setContentTypes(nextCt);
      try {
        await applyPatch(channels, nextCt);
      } catch {
        setContentTypes(prevCt);
      }
    },
    [channels, contentTypes, applyPatch]
  );

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton />
      <ThemedScroller className="pb-10">
        <Section
          titleSize="3xl"
          className="pt-4 pb-6"
          title={t('communicationSettingsTitle')}
          subtitle={t('communicationSettingsSubtitle')}
        />

        {!apiToken ? (
          <ThemedText className="text-light-subtext dark:text-dark-subtext">{t('communicationSettingsNeedLogin')}</ThemedText>
        ) : loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="small" />
            <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <ThemedText className="text-light-subtext dark:text-dark-subtext">{error}</ThemedText>
        ) : channels && contentTypes ? (
          <>
            <ThemedText className="text-lg font-semibold mb-3 text-light-text dark:text-dark-text">
              {t('communicationSettingsChannelsSection')}
            </ThemedText>
            {CHANNEL_ROWS.map(({ key, label }) => (
              <Switch
                key={key}
                label={t(label)}
                value={channels[key]}
                onChange={(v) => void onChannelChange(key, v)}
                className="mb-4"
              />
            ))}

            <Divider className="my-6" />

            <ThemedText className="text-lg font-semibold mb-3 text-light-text dark:text-dark-text">
              {t('communicationSettingsContentSection')}
            </ThemedText>
            {CONTENT_ROWS.map(({ key, label }) => (
              <Switch
                key={key}
                label={t(label)}
                value={contentTypes[key]}
                onChange={(v) => void onContentChange(key, v)}
                className="mb-4"
              />
            ))}
          </>
        ) : null}
      </ThemedScroller>
    </View>
  );
}
