import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getReferrals, type ClientReferralItem } from '@/api/referrals';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

function safeText(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

function formatDateTime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function statusHeadline(status: string, t: (k: any) => string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'REWARDED') return t('referralInviteHeadlineRewarded');
  if (s === 'QUALIFIED') return t('referralInviteHeadlineQualified');
  if (s === 'LIMIT_REACHED') return t('referralInviteHeadlineLimitReached');
  return t('referralInviteHeadlinePending');
}

type ChecklistState = 'done' | 'current' | 'pending';

function checklistIcon(state: ChecklistState): { name: 'Check'; bg: string; fg: string; ring: string } {
  if (state === 'done') return { name: 'Check', bg: 'bg-emerald-600', fg: '#ffffff', ring: 'border-emerald-600' };
  if (state === 'current') return { name: 'Check', bg: 'bg-light-secondary dark:bg-dark-secondary', fg: '#16a34a', ring: 'border-emerald-600' };
  return { name: 'Check', bg: 'bg-light-secondary dark:bg-dark-secondary', fg: '#9ca3af', ring: 'border-light-border dark:border-dark-border' };
}

function ChecklistRow({
  title,
  subtitle,
  state,
}: {
  title: string;
  subtitle?: string | null;
  state: ChecklistState;
}) {
  const icon = checklistIcon(state);
  return (
    <View className="flex-row items-start gap-3 py-3">
      <View className={`w-9 h-9 rounded-full items-center justify-center border ${icon.ring} ${icon.bg}`}>
        <Icon name={icon.name} size={18} color={icon.fg} />
      </View>
      <View className="flex-1">
        <ThemedText className="text-base font-semibold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

export default function ReferralInviteDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inviteId = (Array.isArray(id) ? id[0] : id) ?? '';
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();

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

  const attribution = invite?.attribution ?? null;
  const spend = invite?.spendProgress ?? null;
  const inviteCreatedAt = invite?.createdAt ?? null;
  const invitedOn = inviteCreatedAt ? formatDateTime(inviteCreatedAt, locale) : null;

  const acceptedDone = Boolean(attribution?.createdAt);
  const pairedDone = String(attribution?.status || '').toUpperCase() === 'CONSUMED';
  const requiredAmount = spend?.requiredAmount ?? null;
  const spentAmount = spend?.spentCashCard ?? null;
  const paidDone =
    requiredAmount != null && spentAmount != null
      ? spentAmount >= requiredAmount
      : ['QUALIFIED', 'REWARDED', 'LIMIT_REACHED'].includes(String(invite?.status || '').toUpperCase());

  const acceptedState: ChecklistState = acceptedDone ? 'done' : 'current';
  const pairedState: ChecklistState = pairedDone ? 'done' : acceptedDone ? 'current' : 'pending';
  const paidState: ChecklistState =
    paidDone ? 'done' : pairedDone ? 'current' : 'pending';

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
            {/* Header block */}
            <View className="items-center pt-4 pb-3">
              <Avatar src={require('@/assets/img/wallet/RB.avatar.jpg')} size="xl" border />
              <ThemedText className="text-2xl font-bold mt-3 text-center">
                {safeText(invite.referee?.name)}
              </ThemedText>
              {invitedOn ? (
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                  {t('referralInviteInvitedOn')} {invitedOn}
                </ThemedText>
              ) : null}
              <ThemedText className="text-sm font-semibold mt-4 text-center">
                {statusHeadline(invite.status, t)}
              </ThemedText>
            </View>

            <Divider className="my-4" />

            {/* Checklist */}
            <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5">
              <ChecklistRow
                title={t('referralChecklistAccepted')}
                subtitle={attribution?.createdAt ? formatDateTime(attribution.createdAt, locale) : null}
                state={acceptedState}
              />
              <Divider className="my-1" />
              <ChecklistRow
                title={t('referralChecklistPaired')}
                subtitle={attribution?.consumedAt ? formatDateTime(attribution.consumedAt, locale) : null}
                state={pairedState}
              />
              <Divider className="my-1" />
              <ChecklistRow
                title={t('referralChecklistPaid')}
                subtitle={
                  spend
                    ? t('referralSpendLine')
                        .replace('{spent}', String(spend.spentCashCard))
                        .replace('{required}', String(spend.requiredAmount))
                        .replace('{remaining}', String(spend.remaining))
                    : null
                }
                state={paidState}
              />
            </View>

            {/* Reward meta (only when present) */}
            {invite.rewardedAt || invite.referrerReward != null ? (
              <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5 mt-4">
                {invite.rewardedAt ? (
                  <View className="flex-row justify-between">
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {t('referralRewardedAt')}
                    </ThemedText>
                    <ThemedText className="text-sm font-semibold">
                      {formatDateTime(invite.rewardedAt, locale)}
                    </ThemedText>
                  </View>
                ) : null}
                {invite.referrerReward != null ? (
                  <View className={`flex-row justify-between ${invite.rewardedAt ? 'mt-3' : ''}`}>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {t('referralRewardAmount')}
                    </ThemedText>
                    <ThemedText className="text-sm font-semibold">{invite.referrerReward} RBC</ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ThemedScroller>
    </View>
  );
}

