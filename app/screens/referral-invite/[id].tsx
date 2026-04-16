import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Animated } from 'react-native';

import { getReferrals, type ClientReferralItem } from '@/api/referrals';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';

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

function statusLabel(status: string, t: (k: any) => string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'REWARDED') return t('referralInviteHeadlineRewarded');
  if (s === 'QUALIFIED') return t('referralInviteHeadlineQualified');
  if (s === 'LIMIT_REACHED') return t('referralInviteHeadlineLimitReached');
  return t('referralInviteHeadlinePending');
}

function statusPillClass(status: string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'REWARDED') return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (s === 'QUALIFIED') return 'bg-blue-100 dark:bg-blue-900/30';
  if (s === 'LIMIT_REACHED') return 'bg-red-100 dark:bg-red-900/30';
  return 'bg-light-secondary dark:bg-dark-secondary';
}

function statusTextClass(status: string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'REWARDED') return 'text-emerald-700 dark:text-emerald-300';
  if (s === 'QUALIFIED') return 'text-blue-700 dark:text-blue-300';
  if (s === 'LIMIT_REACHED') return 'text-red-600 dark:text-red-400';
  return 'text-light-subtext dark:text-dark-subtext';
}

type ChecklistState = 'done' | 'current' | 'pending';

function ChecklistRow({
  title,
  subtitle,
  state,
}: {
  title: string;
  subtitle?: string | null;
  state: ChecklistState;
}) {
  const isDone = state === 'done';
  const isCurrent = state === 'current';
  const bgClass = isDone
    ? 'bg-emerald-600'
    : 'bg-light-secondary dark:bg-dark-secondary';
  const borderClass = isDone || isCurrent ? 'border-emerald-600' : 'border-light-border dark:border-dark-border';
  const iconColor = isDone ? '#ffffff' : isCurrent ? '#16a34a' : '#9ca3af';

  return (
    <View className="flex-row items-start gap-3 py-3">
      <View className={`h-9 w-9 items-center justify-center rounded-full border ${borderClass} ${bgClass}`}>
        <Icon name="Check" size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <ThemedText className="text-base font-semibold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center gap-2">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{label}</ThemedText>
      </View>
      <ThemedText className="text-sm font-semibold">{value}</ThemedText>
    </View>
  );
}

const FALLBACK_COVER = require('@/assets/img/wallet/RB.avatar.jpg');

export default function ReferralInviteDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inviteId = (Array.isArray(id) ? id[0] : id) ?? '';
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();
  const heroScrollY = React.useRef(new Animated.Value(0)).current;

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

  if (loading) {
    return (
      <>
        <Header title={t('referralInviteDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !invite) {
    return (
      <>
        <Header title={t('referralInviteDetailTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? t('referralInviteNotFound')}
          </ThemedText>
        </View>
      </>
    );
  }

  const attribution = invite.attribution ?? null;
  const spend = invite.spendProgress ?? null;
  const invitedOn = invite.createdAt ? formatDateTime(invite.createdAt, locale) : null;

  const acceptedDone = Boolean(attribution?.createdAt);
  const pairedDone = String(attribution?.status || '').toUpperCase() === 'CONSUMED';
  const requiredAmount = spend?.requiredAmount ?? null;
  const spentAmount = spend?.spentCashCard ?? null;
  const paidDone =
    requiredAmount != null && spentAmount != null
      ? spentAmount >= requiredAmount
      : ['QUALIFIED', 'REWARDED', 'LIMIT_REACHED'].includes(
          String(invite.status || '').toUpperCase()
        );

  const acceptedState: ChecklistState = acceptedDone ? 'done' : 'current';
  const pairedState: ChecklistState = pairedDone ? 'done' : acceptedDone ? 'current' : 'pending';
  const paidState: ChecklistState = paidDone ? 'done' : pairedDone ? 'current' : 'pending';

  const coverImage = invite.program?.coverImageUrl ?? invite.coverImageUrl ?? null;
  const carouselImages: (string | number)[] = coverImage ? [coverImage] : [FALLBACK_COVER];

  const refereeName = safeText(invite.referee?.name);
  const refereeAvatarUrl = invite.referee?.avatarUrl ?? undefined;
  const programName = safeText(invite.program?.name);

  return (
    <>
      <Header title={t('referralInviteDetailTitle')} showBackButton />
      <ThemedScroller
        className="flex-1 px-0"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>

        {/* Hero image */}
        <View className="px-global">
          <ImageCarousel
            height={260}
            rounded="2xl"
            images={carouselImages}
            scrollY={heroScrollY}
            stretchOnPullDown
          />
        </View>

        {/* Title + status */}
        <View className="px-global pb-4 pt-6">
          <ThemedText className="mb-2 text-2xl font-bold">{t('referralInviteDetailTitle')}</ThemedText>
          <View className="flex-row items-center gap-2">
            <View className={`rounded-full px-2.5 py-1 ${statusPillClass(invite.status)}`}>
              <ThemedText className={`text-xs font-semibold ${statusTextClass(invite.status)}`}>
                {statusLabel(invite.status, t)}
              </ThemedText>
            </View>
          </View>
        </View>

        <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

        {/* Referee section */}
        <Section title={t('referralChecklistAccepted')} titleSize="lg" className="px-global pt-4">
          <View className="mb-4 mt-4 flex-row items-center gap-3">
            <Avatar src={refereeAvatarUrl} name={refereeName} size="lg" />
            <View className="min-w-0 flex-1">
              <ThemedText className="text-lg font-semibold">{refereeName}</ThemedText>
              {invitedOn ? (
                <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralInviteInvitedOn')} {invitedOn}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </Section>

        <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

        {/* Program info */}
        <Section title={t('referralAttributionLead')} titleSize="lg" className="px-global pt-4">
          <View className="mt-4 rounded-2xl bg-light-secondary p-5 dark:bg-dark-secondary">
            <InfoRow label={t('referralProgram') ?? 'Program'} value={programName} />
            {invite.referrerReward != null ? (
              <>
                <Divider />
                <InfoRow
                  label={t('referralRewardAmount')}
                  value={`${invite.referrerReward} RBC`}
                />
              </>
            ) : null}
            {invite.rewardedAt ? (
              <>
                <Divider />
                <InfoRow
                  label={t('referralRewardedAt')}
                  value={formatDateTime(invite.rewardedAt, locale)}
                />
              </>
            ) : null}
          </View>
        </Section>

        <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

        {/* Progress checklist */}
        <Section title={t('referralAttributionTimeline')} titleSize="lg" className="px-global pt-4">
          <View className="mt-4 rounded-2xl bg-light-secondary p-5 dark:bg-dark-secondary">
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
        </Section>

        <View className="h-8" />
      </ThemedScroller>
    </>
  );
}
