import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { getReferrals, type PendingAttributionItem } from '@/api/referrals';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';

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

export default function ReferralAttributionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const attrId = (Array.isArray(id) ? id[0] : id) ?? '';
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAttributionItem[]>([]);

  useEffect(() => {
    if (!apiToken || !attrId) return;
    setLoading(true);
    setError(null);
    getReferrals(apiToken, { includeProgress: true })
      .then((r) => setPending(r.pendingAttributions || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, attrId]);

  const item = useMemo(() => pending.find((p) => p.id === attrId) ?? null, [attrId, pending]);

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title={t('referralAttributionTitle')} showBackButton />
      <ThemedScroller className="flex-1 p-global">
        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="small" />
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="py-8">
            <ThemedText className="text-center text-sm text-red-500 dark:text-red-400">
              {error}
            </ThemedText>
          </View>
        ) : !item ? (
          <View className="py-8">
            <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
              {t('referralAttributionNotFound')}
            </ThemedText>
          </View>
        ) : (
          <>
            <Section title={t('referralAttributionLead')} titleSize="lg" />
            <View className="rounded-2xl bg-light-secondary p-5 dark:bg-dark-secondary">
              <View className="flex-row justify-between">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralAttributionPhone')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{item.phone}</ThemedText>
              </View>
              <View className="mt-3 flex-row justify-between">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('referralAttributionStatus')}
                </ThemedText>
                <ThemedText className="text-sm font-semibold">{item.status}</ThemedText>
              </View>
            </View>

            <Divider className="my-6" />

            <Section title={t('referralAttributionTimeline')} titleSize="lg" />
            <View className="rounded-2xl bg-light-secondary p-5 dark:bg-dark-secondary">
              <ThemedText className="text-sm font-semibold">
                {t('referralStepPhoneEntered')}
              </ThemedText>
              <ThemedText className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
                {formatDateTime(item.createdAt, locale)}
              </ThemedText>
            </View>
          </>
        )}
      </ThemedScroller>
    </View>
  );
}
