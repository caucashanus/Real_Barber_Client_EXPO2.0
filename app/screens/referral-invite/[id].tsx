import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getReferrals, type ClientReferralItem } from '@/api/referrals';

function safeText(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

export default function ReferralInviteDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inviteId = (Array.isArray(id) ? id[0] : id) ?? '';
  const { apiToken } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralsMade, setReferralsMade] = useState<ClientReferralItem[]>([]);

  useEffect(() => {
    if (!apiToken || !inviteId) return;
    setLoading(true);
    setError(null);
    getReferrals(apiToken, { includeProgress: true })
      .then((r) => setReferralsMade(r.referralsMade || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, inviteId]);

  const invite = useMemo(
    () => referralsMade.find((r) => r.id === inviteId) ?? null,
    [inviteId, referralsMade]
  );

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title={t('referralInviteDetailTitle')} showBackButton />
      <ThemedScroller className="flex-1 p-global">
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
        ) : !invite ? (
          <View className="py-8">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">
              {t('referralInviteNotFound')}
            </ThemedText>
          </View>
        ) : (
          <>
            <Section title={t('referralInvitePerson')} titleSize="lg" />
            <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5">
              <View className="flex-row justify-between">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralInviteName')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{safeText(invite.referee?.name)}</ThemedText>
              </View>
              <View className="flex-row justify-between mt-3">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralInviteStatus')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{safeText(invite.status)}</ThemedText>
              </View>
            </View>

            <Divider className="my-6" />

            <Section title={t('referralInviteProgress')} titleSize="lg" />
            <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5">
              <View className="flex-row justify-between">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralInviteNextStep')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{safeText(invite.progress?.nextStepName)}</ThemedText>
              </View>
              <View className="flex-row justify-between mt-3">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralInvitePercentage')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">
                  {invite.progress?.percentage != null ? `${invite.progress.percentage}%` : '—'}
                </ThemedText>
              </View>
              <View className="flex-row justify-between mt-3">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralInviteSteps')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">
                  {invite.progress?.completedSteps != null && invite.progress?.totalSteps != null
                    ? `${invite.progress.completedSteps}/${invite.progress.totalSteps}`
                    : '—'}
                </ThemedText>
              </View>
              {invite.progress?.error ? (
                <ThemedText className="text-xs text-red-500 dark:text-red-400 mt-4">
                  {invite.progress.error}
                </ThemedText>
              ) : null}
            </View>
          </>
        )}
      </ThemedScroller>
    </View>
  );
}

