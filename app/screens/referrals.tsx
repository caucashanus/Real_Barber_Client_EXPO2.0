import React, { useEffect, useState } from 'react';
import { View, Pressable, Share } from 'react-native';

import { getReferrals, type ClientReferralsResponse } from '@/api/referrals';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';

const ReferralsScreen = () => {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [referrals, setReferrals] = useState<ClientReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    setLoading(true);
    setError(null);
    getReferrals(apiToken)
      .then(setReferrals)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const stats = referrals?.stats;
  const invited = stats?.totalReferralsMade ?? 0;
  const rewardsRbc = stats?.totalRewardsEarned ?? 0;
  const clientId = referrals?.client?.id;

  const handleShare = async () => {
    const inviteUrl = clientId
      ? `https://crm.xrb.cz/invite?ref=${encodeURIComponent(clientId)}`
      : 'https://crm.xrb.cz';
    try {
      await Share.share({
        message: `Join me on the app — use my link to get started: ${inviteUrl}`,
        title: 'Invite',
      });
    } catch {
      /* share cancelled */
    }
  };

  return (
    <>
      <Header title="" showBackButton />
      <ThemedScroller className="flex-1 px-0" keyboardShouldPersistTaps="handled">
        {/* Hero block – same layout as Earnings */}
        <View className="mb-20 mt-14 px-global">
          <ThemedText variant="emphasis" className="text-5xl">{t('referralsInvited')}</ThemedText>
          <ThemedText variant="emphasis" style={{ color: colors.highlight }} className="text-5xl">
            {loading ? '…' : invited}
          </ThemedText>
          <ThemedText variant="emphasis" className="text-5xl">{t('referralsFriends')}</ThemedText>
          <ThemedText className="mt-2 text-lg">
            Rewards earned{' '}
            <ThemedText variant="h4">{rewardsRbc} RBC</ThemedText>
          </ThemedText>
          {error && (
            <ThemedText className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</ThemedText>
          )}
        </View>

        {/* Content block – same border/section style as Earnings */}
        <View className="border-t-8 border-light-secondary px-global pt-global dark:border-dark-secondary">
          <ThemedText variant="h2" className="mb-2">
            {t('referralsInviteFriends')}
          </ThemedText>
          <ThemedText className="mb-4 text-base text-light-subtext dark:text-dark-subtext">
            Share your link — you both earn RBC when they join and book.
          </ThemedText>
          <Pressable
            onPress={handleShare}
            className="flex-row items-center justify-center rounded-xl bg-light-secondary px-6 py-4 dark:bg-dark-secondary">
            <Icon name="Share2" size={22} />
            <ThemedText variant="emphasis" className="ml-3">
              {t('referralsShareLink')}
            </ThemedText>
          </Pressable>

          {referrals && referrals.referralsMade.length > 0 && (
            <>
              <ThemedText variant="h2" className="mb-4 mt-8">
                {t('referralsInvitedList')}
              </ThemedText>
              {referrals.referralsMade.map((r) => (
                <View
                  key={r.id ?? String(r)}
                  className="my-3 flex-row items-center justify-between">
                  <ThemedText className="text-lg">{r.referee?.name ?? '—'}</ThemedText>
                  <ThemedText className="text-base capitalize text-light-subtext dark:text-dark-subtext">
                    {r.status ?? '—'}
                  </ThemedText>
                </View>
              ))}
            </>
          )}
        </View>
      </ThemedScroller>
    </>
  );
};

export default ReferralsScreen;
