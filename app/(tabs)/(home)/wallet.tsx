import ThemeScroller from '@/components/ThemeScroller';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Animated, Pressable, ActivityIndicator, ScrollView, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedView from '@/components/AnimatedView';

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
import { getReferrals, type ReferralActiveProgram } from '@/api/referrals';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Link, useRouter } from 'expo-router';
import TransactionDetailModal from '@/components/TransactionDetailModal';

const MOCK_CURRENCY = 'RBC';
const WALLET_LAST_SEEN_BALANCE_KEY = 'wallet_last_seen_rbc_balance';

function formatBalance(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatTransactionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Krátký název pro řádek v seznamu (jako v referenci: label nebo jméno, ne dlouhý popis). */
function transactionListTitle(item: RbCoinsHistoryItem): string {
  if (item.description?.startsWith('Created gift card:')) return 'Gift card created';
  if (item.description?.startsWith('Cashback z nákupu')) return 'Cashback';
  if (item.otherParty?.name) return item.otherParty.name;
  return 'RealBarber';
}

function transactionAvatarSrc(item: RbCoinsHistoryItem): string | import('react-native').ImageSourcePropType {
  if (item.otherParty?.avatarUrl) return item.otherParty.avatarUrl;
  if (item.type === 'TRANSFER') return require('@/assets/img/wallet/RB.avatar.jpg');
  return require('@/assets/img/wallet/realbarber.png');
}

const ANIM_DURATION_MS = 500;
/** Skrytí referral karty podle ID programu (24 h). */
const WALLET_REFERRAL_PROMO_DISMISSED_KEY = 'wallet_referral_promo_dismissed';
const WALLET_PROMO_HIDE_MS = 24 * 60 * 60 * 1000; // 24 h

function normalizeActivePrograms(raw: unknown): ReferralActiveProgram[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is ReferralActiveProgram =>
      typeof p === 'object' &&
      p !== null &&
      typeof (p as ReferralActiveProgram).id === 'string' &&
      typeof (p as ReferralActiveProgram).name === 'string'
  );
}

/** Peněženka: „Více“ (tlačítko pod zůstatkem + akce v řádku) → `/screens/rbc`. */
const SHOW_WALLET_MORE_RBC = false;

/** Peněženka: akce „Přidat peníze“ a „Detail“. */
const SHOW_WALLET_ADD_MONEY_AND_DETAILS = false;

/** Peněženka: horizontálně posuvné promo karty pod akcemi. */
const SHOW_WALLET_HORIZONTAL_PROMO_CARDS = true;

const WalletScreen = () => {
  const router = useRouter();
  const scrollY = useContext(ScrollContext);
  const colors = useThemeColors();
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
  const [dismissedReferralPromoAt, setDismissedReferralPromoAt] = useState<Record<string, number>>({});
  const [referralPrograms, setReferralPrograms] = useState<ReferralActiveProgram[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed: Record<string, number> = JSON.parse(raw);
        const now = Date.now();
        const next: Record<string, number> = {};
        Object.entries(parsed).forEach(([programId, ts]) => {
          if (typeof programId === 'string' && now - ts < WALLET_PROMO_HIDE_MS) {
            next[programId] = ts;
          }
        });
        setDismissedReferralPromoAt(next);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const handleDismissReferralPromo = (programId: string) => {
    const now = Date.now();
    setDismissedReferralPromoAt((prev) => {
      const next = { ...prev, [programId]: now };
      AsyncStorage.setItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
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
      setReferralPrograms([]);
      setBalanceLoading(false);
      setHistoryLoading(false);
      setReferralsLoading(false);
      lastAnimatedBalanceRef.current = null;
      return;
    }
    setBalanceLoading(true);
    setBalanceError(null);
    getRbCoinsBalance(apiToken)
      .then((r) => setBalance(r.balance))
      .catch((e) => setBalanceError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setBalanceLoading(false));

    setHistoryLoading(true);
    getRbCoinsHistory(apiToken)
      .then((r) => setHistory(r.data.slice(0, 3)))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));

    setReferralsLoading(true);
    getReferrals(apiToken)
      .then((r) => setReferralPrograms(normalizeActivePrograms(r.activePrograms)))
      .catch(() => setReferralPrograms([]))
      .finally(() => setReferralsLoading(false));
  }, [apiToken]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      getRbCoinsBalance(apiToken)
        .then((r) => setBalance(r.balance))
        .catch((e) => setBalanceError(e instanceof Error ? e.message : 'Error'));
      getRbCoinsHistory(apiToken)
        .then((r) => setHistory(r.data.slice(0, 3)))
        .catch(() => {});
      getReferrals(apiToken)
        .then((r) => setReferralPrograms(normalizeActivePrograms(r.activePrograms)))
        .catch(() => {});
    }, [apiToken])
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
        useNativeDriver: false,
      }).start(() => {
        countAnim.removeListener(listener);
        setDisplayAmount(balance);
        setLastSeenBalance(WALLET_LAST_SEEN_BALANCE_KEY, String(balance));
      });
    });
  }, [balance]);

  const visibleReferralPrograms = referralPrograms.filter(
    (p) =>
      !dismissedReferralPromoAt[p.id] ||
      Date.now() - dismissedReferralPromoAt[p.id] >= WALLET_PROMO_HIDE_MS
  );
  const showReferralPromoStrip =
    SHOW_WALLET_HORIZONTAL_PROMO_CARDS && (referralsLoading || visibleReferralPrograms.length > 0);

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
          <ThemedText className="text-sm text-white/80 text-center">Personal · RBC</ThemedText>
          {balanceLoading ? (
            <ActivityIndicator color="white" size="small" className="mt-2" />
          ) : balanceError ? (
            <ThemedText className="text-lg text-white/90 mt-1 text-center">{balanceError}</ThemedText>
          ) : (
            <ThemedText className="text-5xl font-bold text-white mt-1 text-center">{formatBalance(displayAmount)} {MOCK_CURRENCY}</ThemedText>
          )}
          {SHOW_WALLET_MORE_RBC ? (
            <View className="items-center mt-4">
              <Button title={t('walletMoreButton')} variant="outline" size="small" className="rounded-full px-6 bg-white/10 border-white/30" textClassName="text-white" href="/screens/rbc" />
            </View>
          ) : null}
        </View>

        {/* 2. Akční tlačítka – stejný blok se stínem */}
        <View style={{ ...shadowPresets.large }} className="flex-row justify-around p-5 -mt-2 rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          {SHOW_WALLET_ADD_MONEY_AND_DETAILS ? (
            <Pressable className="items-center">
              <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
                <Icon name="Plus" size={24} color={colors.text} />
              </View>
              <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">{t('walletAddMoney')}</ThemedText>
            </Pressable>
          ) : null}
          <Pressable className="items-center" onPress={() => router.push('/screens/transfer-select-recipient')}>
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="ArrowLeftRight" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">{t('walletTransfer')}</ThemedText>
          </Pressable>
          {SHOW_WALLET_ADD_MONEY_AND_DETAILS ? (
            <Pressable className="items-center">
              <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
                <Icon name="Building2" size={22} color={colors.text} />
              </View>
              <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">{t('walletDetails')}</ThemedText>
            </Pressable>
          ) : null}
          {SHOW_WALLET_MORE_RBC ? (
            <Pressable className="items-center" onPress={() => router.push('/screens/rbc')}>
              <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
                <Icon name="MoreVertical" size={22} color={colors.text} />
              </View>
              <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">{t('walletMore')}</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* 3. Karty aktivních referral programů z GET /api/client/referrals – X skryje na 24 h */}
        {showReferralPromoStrip ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-global mt-4 mb-0"
            contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24, paddingVertical: 18 }}
          >
            {referralsLoading && visibleReferralPrograms.length === 0 ? (
              <View
                style={{ ...shadowPresets.large, width: 280, marginRight: 15 }}
                className="p-5 rounded-2xl bg-light-secondary dark:bg-dark-secondary flex-shrink-0 items-center justify-center min-h-[120px]"
              >
                <ActivityIndicator size="small" />
              </View>
            ) : null}
            {visibleReferralPrograms.map((program) => {
              const coverUri = program.coverImageUrl?.trim();
              const cardInner = (
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <ThemedText
                      className={`text-lg font-bold ${coverUri ? 'text-white' : 'text-light-text dark:text-dark-text'}`}
                    >
                      {program.name}
                    </ThemedText>
                    <ThemedText
                      className={`text-sm mt-1 ${coverUri ? 'text-white/90' : 'text-light-subtext dark:text-dark-subtext'}`}
                    >
                      {program.description?.trim() ? program.description : '—'}
                    </ThemedText>
                  </View>
                  <Pressable className="p-1" onPress={() => handleDismissReferralPromo(program.id)}>
                    <Icon
                      name="X"
                      size={18}
                      color={coverUri ? '#ffffff' : undefined}
                      className={coverUri ? '' : 'text-light-subtext dark:text-dark-subtext'}
                    />
                  </Pressable>
                </View>
              );

              if (coverUri) {
                return (
                  <ImageBackground
                    key={program.id}
                    source={{ uri: coverUri }}
                    style={[{ ...shadowPresets.large, width: 280, marginRight: 15 }, { minHeight: 140 }]}
                    className="rounded-2xl overflow-hidden flex-shrink-0"
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View
                      className="flex-1 p-5 justify-center rounded-2xl"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      {cardInner}
                    </View>
                  </ImageBackground>
                );
              }

              return (
                <View
                  key={program.id}
                  style={{ ...shadowPresets.large, width: 280, marginRight: 15 }}
                  className="p-5 rounded-2xl bg-light-secondary dark:bg-dark-secondary flex-shrink-0"
                >
                  {cardInner}
                </View>
              );
            })}
          </ScrollView>
        ) : null}

        {/* 4. Transakce – stejný blok se stínem jako na Branches */}
        <Section title={t('walletTransactions')} titleSize="lg" className="mt-6">
          <View style={{ ...shadowPresets.large }} className="mt-2 p-global rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
          <List variant="divided" spacing={12}>
            {historyLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" />
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">{t('commonLoading')}</ThemedText>
              </View>
            ) : history.length === 0 ? (
              <View className="py-6 px-4">
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">{t('walletNoTransactions')}</ThemedText>
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
              <ThemedText className="text-base font-medium text-light-text dark:text-dark-text">{t('walletShowAll')}</ThemedText>
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
