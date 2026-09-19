import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { ClientReferralInvite } from '@/api/referrals';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { ReferralInfoSheet } from '@/components/referral/ReferralInfoSheet';
import {
  REFERRAL_PROGRESS_STEP_COUNT,
  REFERRAL_REWARD_GIFT,
  formatReferralRbc,
  getInviteDaysRemaining,
  getInviteProgressLabels,
  getInviteReachedIndex,
  getInviteStatusCaption,
  inviteShowsCountdown,
} from '@/utils/referralDashboardHelpers';
import { interpolateReferralTemplate } from '@/utils/referralShareLinks';

interface ReferralInviteRowProps {
  invite: ClientReferralInvite;
  ttlDays: number;
}

function ProgressDot({
  filled,
  current,
  isGift,
  accentColor,
}: {
  filled: boolean;
  current: boolean;
  isGift: boolean;
  accentColor: string;
}) {
  if (isGift) {
    return (
      <View
        className="h-7 w-7 items-center justify-center"
        style={{
          opacity: filled || current ? 1 : 0.45,
        }}>
        <Image
          source={REFERRAL_REWARD_GIFT}
          style={{ width: 28, height: 28 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View
      className="h-3.5 w-3.5 rounded-full"
      style={{
        backgroundColor: filled ? accentColor : 'transparent',
        borderWidth: current ? 2 : filled ? 0 : 1,
        borderColor: current ? accentColor : '#a3a3a3',
      }}
    />
  );
}

export default function ReferralInviteRow({ invite, ttlDays }: ReferralInviteRowProps) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyFeedback();
  const { accentColor } = useAccentColor();
  const infoSheetRef = useRef<ActionSheetRef>(null);
  const [sheetKind, setSheetKind] = useState<'deadline' | 'ineligible'>('deadline');

  const reachedIndex = getInviteReachedIndex(invite.status);
  const showTrack = invite.status !== 'INELIGIBLE_EXISTING';
  const labels = getInviteProgressLabels(t);
  const daysRemaining = getInviteDaysRemaining(invite.expiresAt);
  const showCountdown = inviteShowsCountdown(invite.status) && daysRemaining != null;
  const statusCaption = getInviteStatusCaption(invite, t);
  const daysLabel =
    showCountdown && daysRemaining != null
      ? interpolateReferralTemplate(t('referralInviteDaysRemaining'), { days: daysRemaining })
      : null;
  const infoKind: 'deadline' | 'ineligible' | null =
    showCountdown ? 'deadline' : invite.status === 'INELIGIBLE_EXISTING' ? 'ineligible' : null;

  const openInfo = (kind: 'deadline' | 'ineligible') => {
    setSheetKind(kind);
    infoSheetRef.current?.show();
  };

  return (
    <View className="relative py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('referralInviteCopyPhone')}
            onPress={() => copyToClipboard(invite.phone)}
            className="flex-row items-center gap-1.5 self-start active:opacity-70">
            <ThemedText className="text-base font-semibold leading-6">{invite.phone}</ThemedText>
            <Icon
              name="Copy"
              size={12}
              className="shrink-0 text-light-subtext dark:text-dark-subtext"
            />
          </Pressable>

          <Pressable
            className="mt-1 flex-row items-center gap-1 self-start active:opacity-70"
            hitSlop={8}
            disabled={!infoKind}
            onPress={() => infoKind && openInfo(infoKind)}>
            <ThemedText className="text-xs leading-5 text-light-subtext dark:text-dark-subtext">
              {statusCaption}
              {daysLabel ? (
                <ThemedText className="text-xs leading-5 font-medium text-light-text dark:text-dark-text">
                  {` · ${daysLabel}`}
                </ThemedText>
              ) : null}
            </ThemedText>
            {invite.status === 'INELIGIBLE_EXISTING' ? (
              <ThemedText className="text-xs leading-5">😔</ThemedText>
            ) : null}
            {infoKind ? (
              <Icon name="CircleHelp" size={12} className="text-light-subtext dark:text-dark-subtext" />
            ) : null}
          </Pressable>
        </View>

        {invite.status === 'REWARDED' && invite.referrerRewardRbc != null ? (
          <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
            +{formatReferralRbc(invite.referrerRewardRbc)} RBC
          </ThemedText>
        ) : null}
      </View>

      {showTrack && reachedIndex != null ? (
        <View className="mt-4">
          <View className="flex-row items-center">
            {labels.map((label, index) => {
              const filled = index <= reachedIndex;
              const current = index === reachedIndex && invite.status !== 'REWARDED';
              const isLast = index === REFERRAL_PROGRESS_STEP_COUNT - 1;
              const connectorFilled = index < reachedIndex;

              return (
                <View key={label} className={`flex-row items-center ${isLast ? '' : 'flex-1'}`}>
                  <View className="items-center" style={{ width: 56 }}>
                    <ProgressDot
                      filled={filled || invite.status === 'REWARDED'}
                      current={current}
                      isGift={isLast}
                      accentColor={accentColor}
                    />
                    <ThemedText
                      className="mt-1 text-center text-[10px] leading-3 text-light-subtext dark:text-dark-subtext"
                      numberOfLines={2}>
                      {label}
                    </ThemedText>
                  </View>
                  {!isLast ? (
                    <View
                      className="mb-4 h-0.5 flex-1"
                      style={{
                        backgroundColor: connectorFilled ? `${accentColor}80` : 'rgba(163,163,163,0.35)',
                      }}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <ReferralInfoSheet ref={infoSheetRef} kind={sheetKind} ttlDays={ttlDays} />
    </View>
  );
}
