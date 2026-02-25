import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext, useEffect, useState } from 'react';
import { View, Animated, Pressable, ActivityIndicator } from 'react-native';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { ScrollContext } from './_layout';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import Section from '@/components/layout/Section';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Avatar from '@/components/Avatar';
import useThemeColors from '@/app/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';
import { useAuth } from '@/app/contexts/AuthContext';
import { getRbCoinsBalance, getRbCoinsHistory, type RbCoinsHistoryItem } from '@/api/rb-coins';
import { Link } from 'expo-router';
import TransactionDetailModal from '@/components/TransactionDetailModal';

const MOCK_CURRENCY = 'RBC';

function formatBalance(value: number): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatTransactionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
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

const WalletScreen = () => {
  const scrollY = useContext(ScrollContext);
  const colors = useThemeColors();
  const { apiToken } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [history, setHistory] = useState<RbCoinsHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<RbCoinsHistoryItem | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setBalance(null);
      setHistory([]);
      setBalanceLoading(false);
      setHistoryLoading(false);
      return;
    }
    setBalanceLoading(true);
    setBalanceError(null);
    getRbCoinsBalance(apiToken)
      .then((r) => setBalance(r.balance))
      .catch((e) => setBalanceError(e instanceof Error ? e.message : 'Chyba'))
      .finally(() => setBalanceLoading(false));

    setHistoryLoading(true);
    getRbCoinsHistory(apiToken)
      .then((r) => setHistory(r.data.slice(0, 3)))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [apiToken]);

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        {/* 1. Stav RBC – ve light mode tmavě šedé (ne černé), v dark mode jako dřív */}
        <View className="bg-slate-600 dark:bg-neutral-900 rounded-t-3xl px-6 pt-8 pb-6 mb-0 items-center">
          <ThemedText className="text-sm text-white/80 text-center">Osobní · RBC</ThemedText>
          {balanceLoading ? (
            <ActivityIndicator color="white" size="small" className="mt-2" />
          ) : balanceError ? (
            <ThemedText className="text-lg text-white/90 mt-1 text-center">{balanceError}</ThemedText>
          ) : (
            <ThemedText className="text-3xl font-bold text-white mt-1 text-center">{formatBalance(balance ?? 0)} {MOCK_CURRENCY}</ThemedText>
          )}
          <View className="items-center mt-4">
            <Button title="Více" variant="outline" size="small" className="rounded-full px-6 bg-white/10 border-white/30" textClassName="text-white" />
          </View>
        </View>

        {/* 2. Akční tlačítka – stejný blok se stínem */}
        <View style={{ ...shadowPresets.large }} className="flex-row justify-around p-5 -mt-2 rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="Plus" size={24} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Add money</ThemedText>
          </Pressable>
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="ArrowLeftRight" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Transfer</ThemedText>
          </Pressable>
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="Building2" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Details</ThemedText>
          </Pressable>
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="MoreVertical" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">More</ThemedText>
          </Pressable>
        </View>

        {/* 3. Reklamní banner (mock) – stejný styl jako Continue searching */}
        <View style={{ ...shadowPresets.large }} className="mt-4 p-5 rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">FlexiFondy</ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                S variabilním úrokem v EUR, GBP nebo USD. Investiční riziko.
              </ThemedText>
            </View>
            <Pressable className="p-1">
              <Icon name="X" size={18} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          </View>
        </View>

        {/* 4. Transakce – stejný blok se stínem jako na Branches */}
        <Section title="Transakce" titleSize="lg" className="mt-6">
          <View style={{ ...shadowPresets.large }} className="mt-2 p-global rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
          <List variant="divided" spacing={12}>
            {historyLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" />
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">Načítám…</ThemedText>
              </View>
            ) : history.length === 0 ? (
              <View className="py-6 px-4">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">Žádné transakce</ThemedText>
              </View>
            ) : (
              history.map((tx) => {
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
              })
            )}
          </List>
          </View>
          <Link href="/screens/wallet-history" asChild>
            <Pressable className="mt-3 py-3 items-center">
              <ThemedText className="text-base font-medium text-light-text dark:text-dark-text">Show all</ThemedText>
            </Pressable>
          </Link>
        </Section>
      <TransactionDetailModal
        transaction={selectedTransaction}
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      </AnimatedView>
    </ThemeScroller>
  );
};

export default WalletScreen;
