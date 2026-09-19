import { Image } from 'expo-image';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';
import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import {
  REFERRAL_INVITE_HERO,
  REFERRAL_MARKETING_CZK,
} from '@/utils/referralDashboardHelpers';
import { interpolateReferralTemplate } from '@/utils/referralShareLinks';

interface ReferralHomeStepProps {
  onInvite: () => void;
  onMyInvites: () => void;
}

export default function ReferralHomeStep({ onInvite, onMyInvites }: ReferralHomeStepProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const heroSize = screenWidth - 48;

  return (
    <View className="pb-8">
      <View className="items-center">
        <Image
          source={REFERRAL_INVITE_HERO}
          style={{ width: heroSize, height: heroSize }}
          contentFit="contain"
        />
      </View>

      <ThemedText className="mt-6 text-center text-2xl font-bold leading-tight">
        {interpolateReferralTemplate(t('referralHomeHeadline'), { czk: REFERRAL_MARKETING_CZK })}
      </ThemedText>

      <ThemedText className="mt-3 text-center text-sm leading-6 text-light-subtext dark:text-dark-subtext">
        {t('referralHomeLead')}
      </ThemedText>

      <AppButton
        className="mt-8"
        fullWidth
        size="md"
        title={t('referralHomeInviteCta')}
        onPress={onInvite}
      />

      <AppButton
        className="mt-3"
        fullWidth
        variant="outline"
        title={t('referralHomeMyInvitesCta')}
        iconStart="ChevronRight"
        onPress={onMyInvites}
      />
    </View>
  );
}
