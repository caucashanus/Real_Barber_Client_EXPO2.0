import React from 'react';
import { View } from 'react-native';

import type { ClientReferralInvite } from '@/api/referrals';
import { useTranslation } from '@/hooks/useTranslation';
import AppButton from '@/components/AppButton';
import ReferralInviteRow from '@/components/referral/ReferralInviteRow';
import ThemedText from '@/components/ThemedText';

interface ReferralInvitesStepProps {
  invites: ClientReferralInvite[];
  ttlDays: number;
  onInvite: () => void;
}

export default function ReferralInvitesStep({
  invites,
  ttlDays,
  onInvite,
}: ReferralInvitesStepProps) {
  const { t } = useTranslation();

  return (
    <View className="relative pb-8">
      <ThemedText className="text-center text-2xl font-bold leading-tight">
        {t('referralInvitesTitle')}
      </ThemedText>

      {invites.length === 0 ? (
        <View className="mt-8 items-center">
          <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
            {t('referralInvitesEmptyState')}
          </ThemedText>
          <View className="mt-6 w-full">
            <AppButton
              fullWidth
              size="md"
              title={t('referralHomeInviteCta')}
              onPress={onInvite}
            />
          </View>
        </View>
      ) : (
        <View className="mt-6">
          {invites.map((invite, index) => (
            <View key={invite.id}>
              <ReferralInviteRow invite={invite} ttlDays={ttlDays} />
              {index < invites.length - 1 ? (
                <View className="h-px bg-light-primary/10 dark:bg-dark-primary/20" />
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
