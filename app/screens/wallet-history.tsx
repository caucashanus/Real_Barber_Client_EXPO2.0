import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Avatar from '@/components/Avatar';
import { shadowPresets } from '@/utils/useShadow';
import { useAuth } from '@/app/contexts/AuthContext';
import { getRbCoinsHistory, type RbCoinsHistoryItem } from '@/api/rb-coins';
import TransactionDetailModal from '@/components/TransactionDetailModal';

function formatBalance(value: number): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTransactionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
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
  if (dateKey === today) return 'Dnes';
  if (dateKey === yesterdayKey) return 'Včera';
  if (dateKey === dayBeforeKey) return 'Předevčírem';
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
}

function groupByDate(history: RbCoinsHistoryItem[]): { dateKey: string; items: RbCoinsHistoryItem[] }[] {
  const map: Record<string, RbCoinsHistoryItem[]> = {};
  history.forEach((tx) => {
    const key = toDateKey(tx.createdAt);
    if (!map[key]) map[key] = [];
    map[key].push(tx);
  });
  const sorted = Object.keys(map).sort((a, b) => b.localeCompare(a));
  return sorted.map((dateKey) => ({ dateKey, items: map[dateKey] }));
}

/** Krátký název pro řádek v seznamu (jako v referenci: label nebo jméno, ne dlouhý popis). */
function transactionListTitle(item: RbCoinsHistoryItem): string {
  if (item.description?.startsWith('Created gift card:')) return 'Vytvoření dárkové karty';
  if (item.description?.startsWith('Cashback z nákupu')) return 'Cashback';
  if (item.otherParty?.name) return item.otherParty.name;
  return 'RealBarber';
}

function transactionAvatarSrc(item: RbCoinsHistoryItem): string | import('react-native').ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

export default function WalletHistoryScreen() {
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
          <View className="py-12 items-center">
            <ActivityIndicator size="large" />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">Načítání…</ThemedText>
          </View>
        ) : error ? (
          <View className="py-6 px-4">
            <ThemedText className="text-sm text-red-600 dark:text-red-400 text-center">{error}</ThemedText>
          </View>
        ) : history.length === 0 ? (
          <View className="py-12 px-4">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">Žádné transakce</ThemedText>
          </View>
        ) : (
          groupByDate(history).map(({ dateKey, items }) => (
            <Section key={dateKey} title={getSectionTitle(dateKey)} titleSize="lg" className="pt-4 pb-2">
              <View style={{ ...shadowPresets.large }} className="p-global rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
                <List variant="divided" spacing={12}>
                  {items.map((tx) => {
                    const isSent = tx.direction === 'sent';
                    const amountStr = isSent ? `-${formatBalance(tx.amount)} RBC` : `+${formatBalance(tx.amount)} RBC`;
                    return (
                      <ListItem
                        key={tx.id}
                        className="py-2"
                        leading={<Avatar src={transactionAvatarSrc(tx)} size="sm" />}
                        title={transactionListTitle(tx)}
                        subtitle={formatTransactionTime(tx.createdAt)}
                        trailing={
                          <ThemedText className={`text-base font-semibold ${isSent ? 'text-light-text dark:text-dark-text' : 'text-green-600 dark:text-green-400'}`}>
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
