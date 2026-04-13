import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { getRbCoinsHistory, type RbCoinsHistoryItem } from '@/api/rb-coins';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Section from '@/components/layout/Section';
import { shadowPresets } from '@/utils/useShadow';

function formatBalance(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTransactionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getSectionTitle(dateKey: string): string {
  const now = new Date();
  const today = toDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday.toISOString());
  const dayBefore = new Date(now);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const dayBeforeKey = toDateKey(dayBefore.toISOString());
  if (dateKey === today) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';
  if (dateKey === dayBeforeKey) return 'Day before yesterday';
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
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
  return sorted.map((dateKey) => ({ dateKey, items: map[dateKey]! }));
}

function transactionListTitle(item: RbCoinsHistoryItem, t: (key: string) => string): string {
  if (item.description?.startsWith('Created gift card:')) return t('rbcGiftCardCreated');
  if (item.description?.startsWith('Cashback z nákupu')) return t('rbcCashback');
  if (item.otherParty?.name) return item.otherParty.name;
  return 'RealBarber';
}

function transactionAvatarSrc(
  item: RbCoinsHistoryItem
): string | import('react-native').ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

export default function RBCHistorieScreen() {
  const { t } = useTranslation();
  const { apiToken } = useAuth();
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

  return (
    <>
      <Header showBackButton />
      <ThemedScroller>
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {t('commonLoading')}
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
              {t('rbcNoTransactions')}
            </ThemedText>
          </View>
        ) : (
          groupByDate(history).map(({ dateKey, items }) => (
            <Section
              key={dateKey}
              title={getSectionTitle(dateKey, t)}
              titleSize="lg"
              className="px-global pb-2 pt-4">
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
                        title={transactionListTitle(tx, t)}
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
      <TransactionDetailModal
        transaction={selectedTransaction}
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}
