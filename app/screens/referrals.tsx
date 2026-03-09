import React, { useEffect, useState } from 'react';
import { View, Pressable, Share, ActivityIndicator } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import Divider from '@/components/layout/Divider';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getReferrals, type ClientReferralsResponse } from '@/api/referrals';

const ReferralsScreen = () => {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
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
    } catch (_) {}
  };

  return (
    <>
      <Header title="" showBackButton />
      <ThemedScroller className="flex-1 px-0" keyboardShouldPersistTaps="handled">
        {/* Hero block – same layout as Earnings */}
        <View className="mt-14 mb-20 px-global">
          <ThemedText className="text-5xl font-semibold">{t('referralsInvited')}</ThemedText>
          <ThemedText className="text-5xl text-highlight font-semibold">
            {loading ? '…' : invited}
          </ThemedText>
          <ThemedText className="text-5xl font-semibold">{t('referralsFriends')}</ThemedText>
          <ThemedText className="text-lg mt-2">
            Rewards earned <ThemedText className="text-lg font-semibold">{rewardsRbc} RBC</ThemedText>
          </ThemedText>
          {error && (
            <ThemedText className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</ThemedText>
          )}
        </View>

        {/* Content block – same border/section style as Earnings */}
        <View className="px-global border-t-8 pt-global border-light-secondary dark:border-dark-secondary">
          <ThemedText className="text-2xl font-semibold mb-2">{t('referralsInviteFriends')}</ThemedText>
          <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mb-4">
            Share your link — you both earn RBC when they join and book.
          </ThemedText>
          <Pressable
            onPress={handleShare}
            className="flex-row items-center justify-center py-4 px-6 rounded-xl bg-light-secondary dark:bg-dark-secondary"
          >
            <Icon name="Share2" size={22} />
            <ThemedText className="text-base font-semibold ml-3">{t('referralsShareLink')}</ThemedText>
          </Pressable>

          {referrals && referrals.referralsMade.length > 0 && (
            <>
              <ThemedText className="text-2xl font-semibold mt-8 mb-4">{t('referralsInvitedList')}</ThemedText>
              {referrals.referralsMade.map((r: { id?: string; referee?: { name?: string }; status?: string }) => (
                <View key={r.id ?? String(r)} className="flex-row items-center justify-between my-3">
                  <ThemedText className="text-lg">{r.referee?.name ?? '—'}</ThemedText>
                  <ThemedText className="text-base text-light-subtext dark:text-dark-subtext capitalize">
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
