import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import Switch from '@/components/forms/Switch';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
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
    <View className="flex-row items-center">
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
          className="px-4 pb-6 pt-4"
          title={t('profileFeatureSettings')}
          subtitle={t('profileFeatureSettingsSubtitle')}
        />

        <View className="gap-4 px-4">
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

          <Divider className="my-0" />

          <FeatureSettingRow
            leading={<Icon name="Vibrate" size={20} color={colors.text} />}
            label={t('profileFeatureHaptics')}
            description={t('profileFeatureHapticsDesc')}
            value={isHapticsLoading ? true : hapticsEnabled}
            onChange={setHapticsEnabled}
            disabled={isHapticsLoading}
          />
        </View>
      </ThemedScroller>
    </AnimatedView>
  );
}
