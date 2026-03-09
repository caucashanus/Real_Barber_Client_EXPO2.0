import React, { useEffect, useState, useRef } from 'react';
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
import { getEmployees } from '@/api/employees';
import { searchClients } from '@/api/clients';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { useTranslation } from '@/app/hooks/useTranslation';

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

function buildRecipientsFromHistory(history: RbCoinsHistoryItem[], t: (key: string) => string): TransferRecipient[] {
  const byId: Record<string, TransferRecipient> = {};
  history.forEach((tx) => {
    const op = tx.otherParty as RbCoinsHistoryItemOtherParty | null;
    if (!op?.id) return;
    const amount = Math.abs(tx.amount || 0);
    const lastText =
      tx.type === 'TRANSFER'
        ? tx.direction === 'sent'
          ? `${t('transferYouSentRbc')} ${amount} RBC`
          : `${t('transferTheySentYouRbc')} ${amount} RBC`
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

/** Sloučí zaměstnance s údaji z historie (např. "Poslali jste X RBC"). */
function mergeEmployeesWithHistory(
  employees: { id: string; name: string; avatarUrl?: string | null }[],
  historyRecipients: TransferRecipient[]
): TransferRecipient[] {
  const historyById: Record<string, TransferRecipient> = {};
  historyRecipients.forEach((r) => {
    historyById[r.id] = r;
  });
  const merged: TransferRecipient[] = employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    type: 'EMPLOYEE',
    avatarUrl: emp.avatarUrl ?? undefined,
    lastTransaction: historyById[emp.id]?.lastTransaction,
    lastTransactionDate: historyById[emp.id]?.lastTransactionDate,
  }));
  const withRecent = merged.filter((r) => r.lastTransactionDate);
  const withoutRecent = merged.filter((r) => !r.lastTransactionDate);
  const sortByDate = (a: TransferRecipient, b: TransferRecipient) => {
    const da = a.lastTransactionDate ? new Date(a.lastTransactionDate).getTime() : 0;
    const db = b.lastTransactionDate ? new Date(b.lastTransactionDate).getTime() : 0;
    return db - da;
  };
  return [...withRecent.sort(sortByDate), ...withoutRecent.sort((a, b) => a.name.localeCompare(b.name))];
}

function recipientAvatarSrc(r: TransferRecipient): string | import('react-native').ImageSourcePropType {
  if (r.avatarUrl) return r.avatarUrl;
  return require('@/assets/img/wallet/realbarber.png');
}

export default function TransferSelectRecipientScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const setTransferRecipient = useSetTransferRecipient();
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<RbCoinsHistoryItem[]>([]);
  const [recipientsList, setRecipients] = useState<TransferRecipient[]>([]);
  const [clientSearchResults, setClientSearchResults] = useState<TransferRecipient[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getRbCoinsBalance(apiToken).then((r) => r.balance),
      getRbCoinsHistory(apiToken, { limit: 200 }).then((r) => r.data),
      getEmployees(apiToken).catch(() => []),
    ])
      .then(([bal, historyData, employeesList]) => {
        setBalance(bal);
        setHistory(historyData);
        const fromHistory = buildRecipientsFromHistory(historyData, t);
        const employees = Array.isArray(employeesList) ? employeesList : [];
        setRecipients(mergeEmployeesWithHistory(employees, fromHistory));
      })
      .catch(() => {
        setBalance(0);
        setHistory([]);
        setRecipients([]);
      })
      .finally(() => setLoading(false));
  }, [apiToken, t]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (q.length < 2) {
      setClientSearchResults([]);
      setClientSearchLoading(false);
      return;
    }
    setClientSearchLoading(true);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      if (!apiToken) {
        setClientSearchLoading(false);
        return;
      }
      searchClients(apiToken, q, { limit: 10 })
        .then((res) => {
          const list: TransferRecipient[] = (res.clients || []).map((c) => ({
            id: c.id,
            name: c.name || c.displayName || [c.firstName, c.lastName].filter(Boolean).join(' ') || '?',
            type: 'CLIENT',
            avatarUrl: c.avatarUrl ?? undefined,
          }));
          setClientSearchResults(list);
        })
        .catch(() => setClientSearchResults([]))
        .finally(() => setClientSearchLoading(false));
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [apiToken, searchQuery]);

  const employeesFiltered = searchQuery.trim()
    ? recipientsList.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : recipientsList;
  const seenIds = new Set<string>();
  const filtered = [...employeesFiltered, ...clientSearchResults].filter((r) => {
    if (seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });

  const onSelect = (r: TransferRecipient) => {
    const recType = (r.type && String(r.type).toUpperCase() === 'EMPLOYEE') ? 'EMPLOYEE' : 'CLIENT';
    setTransferRecipient({
      id: r.id,
      name: r.name,
      type: recType,
      avatarUrl: r.avatarUrl ?? undefined,
    });
    router.push({
      pathname: `/screens/transfer-chat/${r.id}`,
      params: {
        name: r.name,
        type: recType,
        avatarUrl: r.avatarUrl ?? '',
      },
    });
  };

  return (
    <>
      <Header
        showBackButton
        title={t('transferNewPayment')}
        onBackPress={() => router.back()}
      />
      <ThemedScroller className="flex-1 p-global">
        {/* Balance */}
        <View
          style={{ ...shadowPresets.large }}
          className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-4 mb-4"
        >
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('transferAvailable')}</ThemedText>
          <ThemedText className="text-xl font-bold text-light-text dark:text-dark-text mt-1">
            {formatBalance(balance)} <ThemedText className="text-base font-semibold">RBC</ThemedText>
          </ThemedText>
        </View>

        {/* Search */}
        <View className="flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary border border-light-secondary dark:border-dark-secondary px-3 py-2 mb-4">
          <Icon name="Search" size={20} className="text-light-subtext dark:text-dark-subtext mr-2" />
          <TextInput
            placeholder={t('transferSearchPlaceholder')}
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

        <Section title={t('transferRecipient')} titleSize="lg" />

        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">{t('commonLoading')}</ThemedText>
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-8 px-4">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">
              {searchQuery.trim()
                ? clientSearchLoading
                  ? t('transferSearching')
                  : t('transferNoResults')
                : t('transferNoEmployeesHint')}
            </ThemedText>
          </View>
        ) : (
          <View style={{ ...shadowPresets.large }} className="rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
            <List variant="divided" spacing={12} className="px-4">
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
