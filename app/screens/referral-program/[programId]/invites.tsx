import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getReferrals, type ClientReferralItem, type PendingAttributionItem } from '@/api/referrals';

function inviteStatusLabel(status: string, t: (k: any) => string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'REWARDED') return t('referralInviteStatusRewarded');
  if (s === 'QUALIFIED') return t('referralInviteStatusQualified');
  if (s === 'PENDING') return t('referralInviteStatusPending');
  return t('referralInviteStatusInProgress');
}

function refereeTitle(invite: ClientReferralItem): string {
  return invite.referee?.name?.trim() || '—';
}

function refereeAvatar(invite: ClientReferralItem): string | import('react-native').ImageSourcePropType {
  const src = invite.referee?.avatarUrl?.trim();
  if (src) return src;
  return require('@/assets/img/wallet/realbarber.png');
}

export default function ReferralInvitesScreen() {
  const { programId } = useLocalSearchParams<{ programId?: string }>();
  const pid = (Array.isArray(programId) ? programId[0] : programId) ?? '';
  const router = useRouter();
  const { apiToken } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralsMade, setReferralsMade] = useState<ClientReferralItem[]>([]);
  const [pendingAttributions, setPendingAttributions] = useState<PendingAttributionItem[]>([]);

  useEffect(() => {
    if (!apiToken || !pid) return;
    setLoading(true);
    setError(null);
    getReferrals(apiToken, { includeProgress: true })
      .then((r) => {
        setReferralsMade(r.referralsMade || []);
        setPendingAttributions(r.pendingAttributions || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, pid]);

  const invites = useMemo(
    () => referralsMade.filter((r) => r.programId === pid),
    [pid, referralsMade]
  );

  const pending = useMemo(
    () => pendingAttributions.filter((a) => a.program?.id === pid),
    [pid, pendingAttributions]
  );

  const rows = useMemo(() => {
    const inviteRows = invites.map((invite) => ({
      key: `invite:${invite.id}`,
      title: refereeTitle(invite),
      subtitle: inviteStatusLabel(invite.status, t),
      avatar: refereeAvatar(invite),
      onPress: () => router.push(`/screens/referral-invite/${encodeURIComponent(invite.id)}`),
    }));
    const pendingRows = pending.map((a) => ({
      key: `pending:${a.id}`,
      title: a.phone,
      subtitle: t('referralInviteLeadPhoneEntered'),
      avatar: require('@/assets/img/wallet/realbarber.png') as import('react-native').ImageSourcePropType,
      onPress: () => router.push(`/screens/referral-attribution/${encodeURIComponent(a.id)}`),
    }));
    return [...pendingRows, ...inviteRows];
  }, [invites, pending, router, t]);

  return (
    <>
      <Header title={t('referralInvitesTitle')} showBackButton />
      <ThemedScroller className="flex-1 p-global">
        <Section title={t('referralInvitesSection')} titleSize="lg" />

        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">
              {t('commonLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="py-8">
            <ThemedText className="text-sm text-red-500 dark:text-red-400 text-center">
              {error}
            </ThemedText>
          </View>
        ) : rows.length === 0 ? (
          <View className="py-8">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">
              {t('referralInvitesEmpty')}
            </ThemedText>
          </View>
        ) : (
          <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
            <List variant="divided" spacing={12} className="px-4">
              {rows.map((row) => (
                <ListItem
                  key={row.key}
                  className="py-2"
                  leading={<Avatar src={row.avatar} size="sm" />}
                  title={row.title}
                  subtitle={row.subtitle}
                  onPress={row.onPress}
                />
              ))}
            </List>
          </View>
        )}
      </ThemedScroller>
    </>
  );
}

