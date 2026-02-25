import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { shadowPresets } from '@/utils/useShadow';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  getRbCoinsBalance,
  getRbCoinsHistory,
  type RbCoinsHistoryItem,
  type RbCoinsHistoryItemOtherParty,
} from '@/api/rb-coins';

function formatBalance(value: number): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export interface TransferRecipient {
  id: string;
  name: string;
  type: string;
  avatarUrl?: string | null;
  lastTransaction?: string;
  lastTransactionDate?: string;
}

function buildRecipientsFromHistory(history: RbCoinsHistoryItem[]): TransferRecipient[] {
  const byId: Record<string, TransferRecipient> = {};
  history.forEach((tx) => {
    const op = tx.otherParty as RbCoinsHistoryItemOtherParty | null;
    if (!op?.id) return;
    const amount = Math.abs(tx.amount || 0);
    const lastText =
      tx.type === 'TRANSFER'
        ? tx.direction === 'sent'
          ? `Poslali jste ${amount} RBC`
          : `Poslali vám ${amount} RBC`
        : tx.description || undefined;
    if (!byId[op.id]) {
      byId[op.id] = {
        id: op.id,
        name: op.name || '?',
        type: op.type || 'CLIENT',
        avatarUrl: op.avatarUrl ?? undefined,
        lastTransaction: lastText,
        lastTransactionDate: tx.createdAt,
      };
    } else {
      const cur = byId[op.id];
      const curDate = cur.lastTransactionDate ? new Date(cur.lastTransactionDate).getTime() : 0;
      const txDate = new Date(tx.createdAt).getTime();
      if (txDate > curDate) {
        cur.lastTransaction = lastText;
        cur.lastTransactionDate = tx.createdAt;
      }
    }
  });
  return Object.values(byId).sort((a, b) => {
    const da = a.lastTransactionDate ? new Date(a.lastTransactionDate).getTime() : 0;
    const db = b.lastTransactionDate ? new Date(b.lastTransactionDate).getTime() : 0;
    return db - da;
  });
}

function recipientAvatarSrc(r: TransferRecipient): string | import('react-native').ImageSourcePropType {
  if (r.avatarUrl) return r.avatarUrl;
  return require('@/assets/img/wallet/realbarber.png');
}

export default function TransferSelectRecipientScreen() {
  const router = useRouter();
  const { apiToken } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<RbCoinsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getRbCoinsBalance(apiToken).then((r) => r.balance),
      getRbCoinsHistory(apiToken, { limit: 200 }).then((r) => r.data),
    ])
      .then(([bal, data]) => {
        setBalance(bal);
        setHistory(data);
      })
      .catch(() => {
        setBalance(0);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [apiToken]);

  const recipients = buildRecipientsFromHistory(history);
  const filtered = searchQuery.trim()
    ? recipients.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : recipients;

  const onSelect = (r: TransferRecipient) => {
    router.push({
      pathname: '/screens/transfer-chat/[id]',
      params: { id: r.id, name: r.name, type: r.type || 'CLIENT' },
    });
  };

  return (
    <>
      <Header
        showBackButton
        title="Nová platba"
        onBackPress={() => router.back()}
      />
      <ThemedScroller className="flex-1 p-global">
        {/* Balance */}
        <View
          style={{ ...shadowPresets.large }}
          className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-4 mb-4"
        >
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">Dostupné</ThemedText>
          <ThemedText className="text-xl font-bold text-light-text dark:text-dark-text mt-1">
            {formatBalance(balance)} <ThemedText className="text-base font-semibold">RBC</ThemedText>
          </ThemedText>
        </View>

        {/* Search */}
        <View className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary border border-light-secondary dark:border-dark-secondary px-3 py-2 mb-4">
          <Icon name="Search" size={20} className="text-light-subtext dark:text-dark-subtext mr-2" />
          <TextInput
            placeholder="Jméno, telefon, e-mail"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-light-text dark:text-dark-text py-1"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <Icon name="X" size={18} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          )}
        </View>

        <Section title="Příjemce" titleSize="lg" />

        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">Načítání…</ThemedText>
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-8 px-4">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">
              {searchQuery.trim() ? 'Žádné výsledky nenalezeny' : 'Žádní příjemci z historie transakcí'}
            </ThemedText>
          </View>
        ) : (
          <View style={{ ...shadowPresets.large }} className="rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
            <List variant="divided" spacing={12}>
              {filtered.map((r) => (
                <ListItem
                  key={r.id}
                  className="py-2"
                  leading={<Avatar src={recipientAvatarSrc(r)} size="sm" />}
                  title={r.name}
                  subtitle={r.lastTransaction}
                  onPress={() => onSelect(r)}
                />
              ))}
            </List>
          </View>
        )}
      </ThemedScroller>
    </>
  );
}
