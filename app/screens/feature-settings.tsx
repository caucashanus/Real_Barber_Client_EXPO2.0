import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import Switch from '@/components/forms/Switch';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import { useHapticFeedbackEnabled } from '@/utils/hapticFeedbackPreference';
import { useOperatorButtonEnabled } from '@/utils/operatorButtonPreference';

const OPERATOR_ICON = require('@/assets/img/operator.png');
const LEADING_SIZE = 40;
const LEADING_GAP = 12;

function FeatureSettingRow({
  leading,
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  leading: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center py-4">
      <View
        className="items-center justify-center"
        style={{ width: LEADING_SIZE, height: LEADING_SIZE, marginRight: LEADING_GAP }}>
        {leading}
      </View>
      <View className="flex-1">
        <Switch
          label={label}
          description={description}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="py-0"
        />
      </View>
    </View>
  );
}

export default function FeatureSettingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { enabled: operatorEnabled, setEnabled: setOperatorEnabled, isLoading: isOperatorLoading } =
    useOperatorButtonEnabled();
  const { enabled: hapticsEnabled, setEnabled: setHapticsEnabled, isLoading: isHapticsLoading } =
    useHapticFeedbackEnabled();

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
          title={t('profileFeatureSettings')}
          subtitle={t('profileFeatureSettingsSubtitle')}
        />

        <View className="px-4">
          <FeatureSettingRow
            leading={
              <Image
                source={OPERATOR_ICON}
                style={{ width: LEADING_SIZE, height: LEADING_SIZE, borderRadius: LEADING_SIZE / 2 }}
                contentFit="cover"
              />
            }
            label={t('profileFeatureOperator')}
            description={t('profileFeatureOperatorDesc')}
            value={isOperatorLoading ? true : operatorEnabled}
            onChange={setOperatorEnabled}
            disabled={isOperatorLoading}
          />

          <FeatureSettingRow
            leading={<Icon name="Vibrate" size={20} color={colors.text} />}
            label={t('profileFeatureHaptics')}
            description={t('profileFeatureHapticsDesc')}
            value={isHapticsLoading ? true : hapticsEnabled}
            onChange={setHapticsEnabled}
            disabled={isHapticsLoading}
          />
        </View>

        {__DEV__ ? (
          <View className="mt-8 gap-3 px-4">
            <Pressable
              className="rounded-2xl bg-light-surface p-4 dark:bg-dark-secondary"
              onPress={() => router.push('/screens/booking-live-activity-preview')}>
              <ThemedText className="font-semibold">Booking Live Activity preview</ThemedText>
              <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                8 stage lifecycle (T−90) — ruční přepínání stavů na Lock Screen / Dynamic Island.
              </ThemedText>
            </Pressable>
            <Pressable
              className="rounded-2xl bg-light-surface p-4 dark:bg-dark-secondary"
              onPress={() => router.push('/screens/widgets-example')}>
              <ThemedText className="font-semibold">Widgets example (expo/examples)</ThemedText>
              <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                Counter widget + delivery Live Activity — 1:1 with with-widgets example.
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </ThemedScroller>
    </AnimatedView>
  );
}
