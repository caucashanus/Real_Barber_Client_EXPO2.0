import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useAccentColor } from '@/contexts/AccentColorContext';
import { useTranslation } from '@/hooks/useTranslation';
import AppButton from '@/components/AppButton';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import {
  REFERRAL_MARKETING_CZK,
  REFERRAL_REWARD_GIFT,
  formatReferralRbc,
} from '@/utils/referralDashboardHelpers';
import { interpolateReferralTemplate } from '@/utils/referralShareLinks';

interface ReferralRulesStepProps {
  rewardRbc: number;
  ttlDays: number;
  shareLoading: boolean;
  shareFeedback: string | null;
  onShare: () => void;
  onQr: () => void;
  onMyInvites: () => void;
  onRbcInfo: () => void;
}

function TimelineItem({
  isLast,
  title,
  body,
  accentColor,
}: {
  isLast: boolean;
  title: string;
  body: React.ReactNode;
  accentColor: string;
}) {
  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: accentColor }} />
        {!isLast ? (
          <View
            className="my-1 min-h-[48px] w-0.5 flex-1"
            style={{ backgroundColor: accentColor, opacity: 0.35 }}
          />
        ) : null}
      </View>
      <View className={`min-w-0 flex-1 ${isLast ? '' : 'pb-5'}`}>
        <ThemedText className="text-sm font-semibold">{title}</ThemedText>
        <View className="mt-1">
          {typeof body === 'string' ? (
            <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
              {body}
            </ThemedText>
          ) : (
            <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
              {body}
            </ThemedText>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ReferralRulesStep({
  rewardRbc,
  ttlDays,
  shareLoading,
  shareFeedback,
  onShare,
  onQr,
  onMyInvites,
  onRbcInfo,
}: ReferralRulesStepProps) {
  const { t } = useTranslation();
  const { accentColor } = useAccentColor();
  const rbcLabel = formatReferralRbc(rewardRbc);

  const timeline = [
    {
      title: t('referralRule1Title'),
      body: t('referralRule1Body'),
    },
    {
      title: t('referralRule2Title'),
      body: t('referralRule2Body'),
    },
    {
      title: t('referralRule3Title'),
      body: interpolateReferralTemplate(t('referralRule3Body'), { ttl: ttlDays }),
    },
    {
      title: t('referralRule4Title'),
      body: (
        <>
          {interpolateReferralTemplate(t('referralRule4BodyPrefix'), { rbc: rbcLabel })}{' '}
          <ThemedText
            onPress={onRbcInfo}
            className="text-sm font-semibold text-light-text dark:text-dark-text underline">
            {t('referralRule4RbcLink')}
          </ThemedText>
        </>
      ),
    },
  ];

  return (
    <View className="relative pb-24">
      <ThemedText className="text-center text-2xl font-bold leading-tight">
        {interpolateReferralTemplate(t('referralHomeHeadline'), { czk: REFERRAL_MARKETING_CZK })}
      </ThemedText>

      <View className="mt-6">
        {timeline.map((item, index) => (
          <TimelineItem
            key={item.title}
            isLast={index === timeline.length - 1}
            title={item.title}
            body={item.body}
            accentColor={accentColor}
          />
        ))}
      </View>

      <AppButton
        className="mt-4"
        fullWidth
        size="md"
        title={t('referralRulesShareCta')}
        iconEnd="Share"
        loading={shareLoading}
        onPress={onShare}
      />
      <AppButton
        className="mt-3"
        fullWidth
        variant="outline"
        title={t('referralRulesQrCta')}
        iconEnd="QrCode"
        loading={shareLoading}
        onPress={onQr}
      />

      {shareFeedback ? (
        <ThemedText className="mt-3 text-center text-sm text-red-500">{shareFeedback}</ThemedText>
      ) : null}

      <Pressable
        className="mt-4 flex-row items-center justify-center gap-1 py-2 active:opacity-70"
        onPress={onMyInvites}>
        <Icon name="ChevronRight" size={16} className="text-light-subtext dark:text-dark-subtext" />
        <ThemedText className="text-sm font-medium text-light-subtext dark:text-dark-subtext">
          {t('referralHomeMyInvitesCta')}
        </ThemedText>
      </Pressable>

      <View pointerEvents="none" className="absolute -bottom-10 right-0">
        <Image
          source={REFERRAL_REWARD_GIFT}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}
