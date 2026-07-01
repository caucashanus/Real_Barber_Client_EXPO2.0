import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { getRbCoinsHistory, type RbCoinsHistoryItem } from '@/api/rb-coins';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import TransactionDetailSheet from '@/components/TransactionDetailSheet';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import {
  getRbCoinsTransactionListTitle,
  RB_COINS_TX_LIST_KEYS_WALLET,
} from '@/utils/rbcCoinsHistoryUi';
import { shadowPresets } from '@/utils/useShadow';

function formatBalance(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTransactionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getSectionTitle(
  dateKey: string,
  t: (key: TranslationKey) => string,
  locale: string
): string {
  const now = new Date();
  const today = toDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday.toISOString());
  const dayBefore = new Date(now);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const dayBeforeKey = toDateKey(dayBefore.toISOString());
  if (dateKey === today) return t('walletHistoryToday');
  if (dateKey === yesterdayKey) return t('walletHistoryYesterday');
  if (dateKey === dayBeforeKey) return t('walletHistoryDayBefore');
  const d = new Date(dateKey + 'T12:00:00');
  const dateLocale = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' });
}

function groupByDate(
  history: RbCoinsHistoryItem[]
): { dateKey: string; items: RbCoinsHistoryItem[] }[] {
  const map: Record<string, RbCoinsHistoryItem[]> = {};
  history.forEach((tx) => {
    const key = toDateKey(tx.createdAt);
    if (!map[key]) map[key] = [];
    map[key].push(tx);
  });
  const sorted = Object.keys(map).sort((a, b) => b.localeCompare(a));
  return sorted.map((dateKey) => ({ dateKey, items: map[dateKey] }));
}

function transactionAvatarSrc(
  item: RbCoinsHistoryItem
): string | import('react-native').ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

export default function WalletHistoryScreen() {
  const { t, locale } = useTranslation();
  const { apiToken } = useAuth();
  const params = useLocalSearchParams<{ transactionId?: string | string[] }>();
  const transactionIdParam = Array.isArray(params.transactionId)
    ? params.transactionId[0]
    : params.transactionId;
  const pendingTransactionIdRef = useRef(transactionIdParam?.trim() || null);
  const [history, setHistory] = useState<RbCoinsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<RbCoinsHistoryItem | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getRbCoinsHistory(apiToken)
      .then((r) => setHistory(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  useEffect(() => {
    if (loading || !pendingTransactionIdRef.current || history.length === 0) return;
    const targetId = pendingTransactionIdRef.current;
    const found = history.find((tx) => tx.id === targetId);
    if (!found) return;
    pendingTransactionIdRef.current = null;
    setSelectedTransaction(found);
  }, [loading, history]);

  return (
    <>
      <Header title={t('walletHistoryTitle')} showBackButton />
      <ThemedScroller>
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {t('walletHistoryLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="px-4 py-6">
            <ThemedText className="text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </ThemedText>
          </View>
        ) : history.length === 0 ? (
          <View className="px-4 py-12">
            <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
              {t('walletNoTransactions')}
            </ThemedText>
          </View>
        ) : (
          groupByDate(history).map(({ dateKey, items }) => (
            <Section
              key={dateKey}
              title={getSectionTitle(dateKey, t, locale)}
              titleSize="lg"
              className="pb-2 pt-4">
              <View
                style={{ ...shadowPresets.large }}
                className="overflow-hidden rounded-2xl bg-light-secondary p-global dark:bg-dark-secondary">
                <List variant="divided" spacing={12}>
                  {items.map((tx) => {
                    const isSent = tx.direction === 'sent';
                    const amountStr = isSent
                      ? `-${formatBalance(tx.amount)} RBC`
                      : `+${formatBalance(tx.amount)} RBC`;
                    return (
                      <ListItem
                        key={tx.id}
                        className="py-2"
                        leading={<Avatar src={transactionAvatarSrc(tx)} size="sm" />}
                        title={getRbCoinsTransactionListTitle(tx, t, RB_COINS_TX_LIST_KEYS_WALLET)}
                        subtitle={formatTransactionTime(tx.createdAt)}
                        trailing={
                          <ThemedText
                            className={`text-base font-semibold ${isSent ? 'text-light-text dark:text-dark-text' : 'text-green-600 dark:text-green-400'}`}>
                            {amountStr}
                          </ThemedText>
                        }
                        onPress={() => setSelectedTransaction(tx)}
                      />
                    );
                  })}
                </List>
              </View>
            </Section>
          ))
        )}
      </ThemedScroller>
      <TransactionDetailSheet
        transaction={selectedTransaction}
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}
