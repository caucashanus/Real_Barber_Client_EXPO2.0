import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from "expo-router/react-navigation";
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, RefreshControl, Animated, Pressable, Alert } from 'react-native';

import { ScrollContext } from './_layout';

import { getRbCoinsBalance, getRbCoinsHistory, type RbCoinsHistoryItem } from '@/api/rb-coins';
import {
  getClientReferrals,
  isReferralProgramEnabled,
  type ClientReferralsResponse,
} from '@/api/referrals';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import WalletReferralPromoBanner from '@/components/wallet/WalletReferralPromoBanner';
import {
  clearWalletReferralPromoDismiss,
  isWalletReferralPromoDismissed,
  readWalletReferralPromoDismissedAt,
  saveWalletReferralPromoDismissedAt,
} from '@/utils/walletReferralPromoDismiss';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import TransactionDetailSheet from '@/components/TransactionDetailSheet';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import Section from '@/components/layout/Section';
import SurfaceCard from '@/components/layout/SurfaceCard';
import {
  getRbCoinsTransactionAvatarSrc,
  getRbCoinsTransactionListTitle,
  RB_COINS_TX_LIST_KEYS_WALLET} from '@/utils/rbcCoinsHistoryUi';
import { shouldStaleRefresh } from '@/utils/staleRefresh';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

/** In-memory fallback when AsyncStorage native module is unavailable (e.g. web, some dev builds). */
let memoryLastSeen: string | null = null;
async function getLastSeenBalance(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryLastSeen;
  }
}
async function setLastSeenBalance(key: string, value: string): Promise<void> {
  memoryLastSeen = value;
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* ignore when native module unavailable */
  }
}

const MOCK_CURRENCY = 'RBC';
const WALLET_LAST_SEEN_BALANCE_KEY = 'wallet_last_seen_rbc_balance';

function formatBalance(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatTransactionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const ANIM_DURATION_MS = 500;
const DEFAULT_REFERRAL_REWARD_CZK = 500;

const WalletScreen = () => {
  const router = useRouter();
  const scrollY = useContext(ScrollContext);
  const colors = useThemeColors();
  const { accentColor } = useAccentColor();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [history, setHistory] = useState<RbCoinsHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<RbCoinsHistoryItem | null>(null);
  const [displayAmount, setDisplayAmount] = useState(0);
  const countAnim = useRef(new Animated.Value(0)).current;
  const lastAnimatedBalanceRef = useRef<number | null>(null);
  const [referralPromoDismissedAt, setReferralPromoDismissedAt] = useState<number | null>(null);
  const [referralDashboard, setReferralDashboard] = useState<ClientReferralsResponse | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const lastWalletFetchRef = useRef(0);
  const walletInflightRef = useRef<Promise<void> | null>(null);
  const referralPromoInflightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    readWalletReferralPromoDismissedAt().then((ts) => {
      setReferralPromoDismissedAt(ts);
    });
  }, []);

  const handleDismissReferralPromo = () => {
    const now = Date.now();
    setReferralPromoDismissedAt(now);
    void saveWalletReferralPromoDismissedAt(now);
  };

  useEffect(() => {
    getLastSeenBalance(WALLET_LAST_SEEN_BALANCE_KEY).then((stored) => {
      if (stored != null) setDisplayAmount(Number(stored));
    });
  }, []);

  useEffect(() => {
    if (!apiToken) {
      setBalance(null);
      setDisplayAmount(0);
      setHistory([]);
      setReferralDashboard(null);
      setBalanceLoading(false);
      setHistoryLoading(false);
      lastAnimatedBalanceRef.current = null;
      lastWalletFetchRef.current = 0;
      return;
    }
  }, [apiToken]);

  const fetchReferralPromo = useCallback(async () => {
    if (!apiToken) {
      setReferralDashboard(null);
      return;
    }
    if (referralPromoInflightRef.current) return referralPromoInflightRef.current;

    referralPromoInflightRef.current = getClientReferrals(apiToken)
      .then((r) => setReferralDashboard(r))
      .catch(() => setReferralDashboard(null))
      .finally(() => {
        referralPromoInflightRef.current = null;
      });

    return referralPromoInflightRef.current;
  }, [apiToken]);

  const fetchWalletData = useCallback(async (options?: { force?: boolean }) => {
    if (!apiToken) return;
    if (!shouldStaleRefresh(lastWalletFetchRef.current, options)) return;
    if (walletInflightRef.current) return walletInflightRef.current;

    const isInitial = lastWalletFetchRef.current === 0;
    if (isInitial || options?.force) {
      setBalanceLoading(true);
      setHistoryLoading(true);
    }
    setBalanceError(null);

    walletInflightRef.current = (async () => {
      try {
        await Promise.allSettled([
          getRbCoinsBalance(apiToken)
            .then((r) => setBalance(r.balance))
            .catch((e) => setBalanceError(e instanceof Error ? e.message : 'Error')),
          getRbCoinsHistory(apiToken)
            .then((r) => setHistory(r.data.slice(0, 3)))
            .catch(() => setHistory([])),
          fetchReferralPromo(),
        ]);
        lastWalletFetchRef.current = Date.now();
      } finally {
        setBalanceLoading(false);
        setHistoryLoading(false);
        walletInflightRef.current = null;
      }
    })();

    return walletInflightRef.current;
  }, [apiToken, fetchReferralPromo]);

  useEffect(() => {
    void fetchWalletData({ force: true });
  }, [fetchWalletData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData({ force: true });
    setRefreshing(false);
  }, [fetchWalletData]);

  useFocusEffect(
    useCallback(() => {
      void fetchWalletData();
      void fetchReferralPromo();
    }, [fetchWalletData, fetchReferralPromo])
  );

  useEffect(() => {
    if (balance === null || balance === lastAnimatedBalanceRef.current) return;
    lastAnimatedBalanceRef.current = balance;

    getLastSeenBalance(WALLET_LAST_SEEN_BALANCE_KEY).then((stored) => {
      const start = stored != null ? Number(stored) : 0;
      setDisplayAmount(start);
      countAnim.setValue(0);

      const listener = countAnim.addListener(({ value }: { value: number }) => {
        const current = Math.round(start + (balance - start) * value);
        setDisplayAmount(current);
      });

      Animated.timing(countAnim, {
        toValue: 1,
        duration: ANIM_DURATION_MS,
        useNativeDriver: false}).start(() => {
        countAnim.removeListener(listener);
        setDisplayAmount(balance);
        setLastSeenBalance(WALLET_LAST_SEEN_BALANCE_KEY, String(balance));
      });
    });
  }, [balance]);

  const promoDismissed = isWalletReferralPromoDismissed(referralPromoDismissedAt);
  const showReferralPromo =
    !promoDismissed && isReferralProgramEnabled(referralDashboard);
  const referralRewardCzk =
    referralDashboard?.config?.referrerRewardRbc ?? DEFAULT_REFERRAL_REWARD_CZK;

  const handleDevResetReferralPromo = useCallback(() => {
    if (!__DEV__ || !apiToken) return;
    void (async () => {
      await clearWalletReferralPromoDismiss();
      setReferralPromoDismissedAt(null);
      try {
        const dashboard = await getClientReferrals(apiToken);
        setReferralDashboard(dashboard);
        Alert.alert(
          'Referral promo reset',
          dashboard.enabled === true
            ? 'Dismiss vymazán. Banner by se měl zobrazit.'
            : 'Dismiss vymazán, ale API má enabled !== true — banner se neukáže, dokud CRM nezapne program.'
        );
      } catch {
        setReferralDashboard(null);
        Alert.alert(
          'Referral promo reset',
          'Dismiss vymazán, ale GET /api/client/referrals selhalo — banner skrytý.'
        );
      }
    })();
  }, [apiToken]);

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false})}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
      }
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
        {/* 1. Stav RBC — v __DEV__ dlouhý stisk = reset referral promo dismiss */}
        <Pressable
          className="mb-0 items-center rounded-t-3xl bg-neutral-900 px-6 pb-6 pt-8"
          onLongPress={handleDevResetReferralPromo}
          delayLongPress={800}
          disabled={!__DEV__}>
          <ThemedText className="text-center text-sm text-white/80">
            {t('walletPersonalRbcCaption')}
          </ThemedText>
          {balanceLoading ? (
            <SiteLoadingSpinner />
          ) : balanceError ? (
            <ThemedText className="mt-1 text-center text-lg text-white/90">
              {balanceError}
            </ThemedText>
          ) : (
            <ThemedText className="mt-1 text-center text-5xl font-bold text-white">
              {formatBalance(displayAmount)} {MOCK_CURRENCY}
            </ThemedText>
          )}
        </Pressable>

        {/* 2. Akční tlačítka */}
        <SurfaceCard rounded="2xl" className="-mt-2 flex-row justify-around p-5">
          <Pressable
            className="items-center"
            onPress={() => router.push('/screens/transfer-select-recipient')}>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-dark-primary">
              <Icon name="ArrowLeftRight" size={22} color={colors.text} />
            </View>
            <ThemedText className="mt-2 text-xs text-light-text dark:text-dark-text">
              {t('walletTransfer')}
            </ThemedText>
          </Pressable>
          <Pressable
            className="items-center"
            onPress={() => router.push('/screens/wallet-stats')}>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-dark-primary">
              <Icon name="ChartColumn" size={22} color={colors.text} />
            </View>
            <ThemedText className="mt-2 text-xs text-light-text dark:text-dark-text">
              {t('walletStats')}
            </ThemedText>
          </Pressable>
        </SurfaceCard>

        {/* 3. Referral promo banner — enabled === true, dismiss 24 h (parita s webem) */}
        {showReferralPromo ? (
          <View className="mt-4">
            <WalletReferralPromoBanner
              rewardCzk={referralRewardCzk}
              onDismiss={handleDismissReferralPromo}
            />
          </View>
        ) : null}

        {/* 4. Transakce – stejný blok se stínem jako na Branches */}
        <Section title={t('walletTransactions')} titleSize="lg" className="mt-6">
          <SurfaceCard rounded="2xl" className="mt-2 overflow-hidden p-global">
            <List variant="divided" spacing={12}>
              {historyLoading ? (
                <View className="items-center py-6">
                  <SiteLoadingSpinner size="compact" />
                  <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                    {t('commonLoading')}
                  </ThemedText>
                </View>
              ) : history.length === 0 ? (
                <View className="px-4 py-6">
                  <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
                    {t('walletNoTransactions')}
                  </ThemedText>
                </View>
              ) : (
                history.map((tx) => {
                  const isSent = tx.direction === 'sent';
                  const amountStr = isSent
                    ? `-${formatBalance(tx.amount)} RBC`
                    : `+${formatBalance(tx.amount)} RBC`;
                  return (
                    <ListItem
                      key={tx.id}
                      className="py-2"
                      leading={<Avatar src={getRbCoinsTransactionAvatarSrc(tx)} size="sm" />}
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
                })
              )}
            </List>
          </SurfaceCard>
          <Link href="/screens/wallet-history" asChild>
            <Pressable className="mt-3 items-center py-3">
              <ThemedText className="text-base font-medium text-light-text dark:text-dark-text">
                {t('walletShowAll')}
              </ThemedText>
            </Pressable>
          </Link>
        </Section>
        <TransactionDetailSheet
          transaction={selectedTransaction}
          visible={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </AnimatedView>
    </ThemeScroller>
  );
};

export default WalletScreen;
