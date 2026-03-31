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

            <Section title={t('referralInviteTimeline')} titleSize="lg" />
            <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5">
              <ThemedText className="text-base font-semibold mb-4">
                {statusHeadline(invite.status, t)}
              </ThemedText>

              {/* Step 1: phone entered on landing */}
              {attribution?.status ? (
                <View className="mb-4">
                  <ThemedText className="text-sm font-semibold">{t('referralStepPhoneEntered')}</ThemedText>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                    {attribution.createdAt ? formatDateTime(attribution.createdAt, locale) : '—'}
                  </ThemedText>
                </View>
              ) : null}

              {/* Step 2: paired in app */}
              {attribution?.status && String(attribution.status).toUpperCase() === 'CONSUMED' ? (
                <View className="mb-4">
                  <ThemedText className="text-sm font-semibold">{t('referralStepPairedInApp')}</ThemedText>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                    {attribution.consumedAt ? formatDateTime(attribution.consumedAt, locale) : '—'}
                  </ThemedText>
                </View>
              ) : null}

              {/* Step 3: spend progress */}
              {spend ? (
                <View className="mb-4">
                  <ThemedText className="text-sm font-semibold">{t('referralStepSpendProgress')}</ThemedText>
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                    {t('referralSpendLine')
                      .replace('{spent}', String(spend.spentCashCard))
                      .replace('{required}', String(spend.requiredAmount))
                      .replace('{remaining}', String(spend.remaining))}
                  </ThemedText>
                  {spend.startAt ? (
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                      {t('referralSpendSince')}{' '}
                      {formatDateTime(spend.startAt, locale)}
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}

              {/* Step 4: reward state */}
              <View>
                <ThemedText className="text-sm font-semibold">{t('referralStepReward')}</ThemedText>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                  {t('referralRewardStatusLine')
                    .replace('{status}', safeText(invite.status))}
                </ThemedText>
                {invite.rewardedAt ? (
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                    {t('referralRewardedAt')}{' '}
                    {formatDateTime(invite.rewardedAt, locale)}
                  </ThemedText>
                ) : null}
                {invite.referrerReward != null ? (
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                    {t('referralRewardAmount')}{' '}
                    {invite.referrerReward} RBC
                  </ThemedText>
                ) : null}
              </View>
            </View>
          </>
        )}
      </ThemedScroller>
    </View>
  );
}

