import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Animated, Pressable, ActivityIndicator } from 'react-native';

import { getRbCoinsHistory, type RbCoinsHistoryItem } from '@/api/rb-coins';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import {
  filterRbCoinsHistoryByMonth,
  formatMonthName,
  computeChartMonthsForYear,
  computeRbcWalletStats,
  getWalletChartYearBounds,
  RBC_WALLET_MIN_YEAR,
  type RbcWalletChartMonth,
  type RbcWalletHeroMonth,
} from '@/utils/rbcWalletStats';
import {
  getRbCoinsTransactionListTitle,
  RB_COINS_TX_LIST_KEYS_WALLET,
} from '@/utils/rbcCoinsHistoryUi';

const RECEIVED_BAR = '#22c55e';
const SENT_BAR = '#ef4444';
const CHART_HEIGHT = 300;
const PLOT_HEIGHT = 220;
const Y_AXIS_TOP_PAD = 14;
const Y_AXIS_WIDTH = 44;
const GROUP_WIDTH = 52;
const BAR_WIDTH = 14;
const BAR_GAP = 4;
const CHART_SEGMENTS = 4;

function formatBalance(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatRbcAmount(value: number): string {
  return `${formatBalance(value)} RBC`;
}

function formatTransactionDate(iso: string, locale: string): string {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(iso).toLocaleDateString(tag, { day: 'numeric', month: 'long' });
}

async function fetchAllRbCoinsHistory(apiToken: string): Promise<RbCoinsHistoryItem[]> {
  const all: RbCoinsHistoryItem[] = [];
  let page = 1;
  const limit = 100;

  while (page <= 20) {
    const res = await getRbCoinsHistory(apiToken, { page, limit });
    all.push(...res.data);
    if (res.data.length === 0 || page >= res.pagination.pages) break;
    page += 1;
  }

  return all;
}

function formatChartYLabel(value: number): string {
  const num = Math.round(value);
  if (!Number.isFinite(num)) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

function barHeight(value: number, maxValue: number): number {
  if (value <= 0) return 0;
  return Math.max(4, (value / maxValue) * PLOT_HEIGHT);
}

function yTickLabelPosition(
  tick: number,
  maxValue: number
): { top?: number; bottom?: number } {
  if (tick >= maxValue) {
    return { top: 0 };
  }
  if (tick <= 0) {
    return { bottom: 0 };
  }
  return { bottom: (tick / maxValue) * PLOT_HEIGHT - 7 };
}

const GroupedWalletBarChart = ({
  months,
  borderColor,
  labelColor,
  selectedMonthKey,
  onSelectMonth,
  selectionColor,
}: {
  months: RbcWalletChartMonth[];
  borderColor: string;
  labelColor: string;
  selectedMonthKey: string | null;
  onSelectMonth: (monthKey: string) => void;
  selectionColor: string;
}) => {
  const maxValue = useMemo(() => {
    const peak = Math.max(...months.flatMap((month) => [month.received, month.sent]), 0);
    return peak > 0 ? peak : 1;
  }, [months]);

  const yTicks = useMemo(
    () =>
      Array.from({ length: CHART_SEGMENTS + 1 }, (_, index) => (maxValue / CHART_SEGMENTS) * index),
    [maxValue]
  );

  const chartContentWidth = months.length * GROUP_WIDTH;
  const totalWidth = Y_AXIS_WIDTH + chartContentWidth + 8;

  return (
    <View style={{ width: totalWidth, height: CHART_HEIGHT + Y_AXIS_TOP_PAD }}>
      <View className="flex-row" style={{ paddingTop: Y_AXIS_TOP_PAD }}>
        <View style={{ width: Y_AXIS_WIDTH, height: PLOT_HEIGHT, overflow: 'visible' }}>
          {yTicks.map((tick) => (
            <ThemedText
              key={tick}
              className="absolute right-1 text-xs"
              style={{
                ...yTickLabelPosition(tick, maxValue),
                color: labelColor,
              }}>
              {formatChartYLabel(tick)}
            </ThemedText>
          ))}
        </View>

        <View style={{ width: chartContentWidth, height: PLOT_HEIGHT }}>
          {yTicks.map((tick) => (
            <View
              key={`grid-${tick}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: (tick / maxValue) * PLOT_HEIGHT,
                borderTopWidth: 1,
                borderTopColor: borderColor,
                opacity: tick === 0 ? 1 : 0.35,
              }}
            />
          ))}

          {months.map((month, index) => {
            const isSelected = selectedMonthKey === month.monthKey;
            const dimmed = selectedMonthKey != null && !isSelected;

            return (
              <Pressable
                key={month.monthKey}
                onPress={() => onSelectMonth(month.monthKey)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className="absolute bottom-0 flex-row items-end justify-center active:opacity-80"
                style={{
                  left: index * GROUP_WIDTH,
                  width: GROUP_WIDTH,
                  height: PLOT_HEIGHT,
                  gap: BAR_GAP,
                  opacity: dimmed ? 0.4 : 1,
                  backgroundColor: isSelected ? `${selectionColor}22` : 'transparent',
                  borderRadius: 8,
                }}>
                <View
                  style={{
                    width: BAR_WIDTH,
                    height: barHeight(month.received, maxValue),
                    backgroundColor: RECEIVED_BAR,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: BAR_WIDTH,
                    height: barHeight(month.sent, maxValue),
                    backgroundColor: SENT_BAR,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-2 flex-row" style={{ marginLeft: Y_AXIS_WIDTH }}>
        {months.map((month) => {
          const isSelected = selectedMonthKey === month.monthKey;
          return (
            <Pressable
              key={`${month.monthKey}-label`}
              onPress={() => onSelectMonth(month.monthKey)}
              style={{ width: GROUP_WIDTH }}
              className="items-center py-1 active:opacity-70">
              <ThemedText
                className={`text-xs font-medium text-light-subtext dark:text-dark-subtext ${isSelected ? 'font-semibold' : ''}`}
                style={isSelected ? { color: selectionColor } : undefined}>
                {month.shortLabel}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

function heroMonthLabel(
  month: RbcWalletHeroMonth,
  t: (key: TranslationKey) => string
): string {
  if (month.isCurrentMonth) return t('walletStatsThisMonth');
  return t('walletStatsInMonth').replace('{month}', month.monthName);
}

function spentLineLabel(
  month: RbcWalletHeroMonth,
  t: (key: TranslationKey) => string
): string {
  if (month.isCurrentMonth) return t('walletStatsSpentThisMonth');
  return t('walletStatsSpentInMonth').replace('{month}', month.monthName);
}

const ChartYearSelector = ({
  year,
  minYear,
  maxYear,
  onPrevious,
  onNext,
}: {
  year: number;
  minYear: number;
  maxYear: number;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  const canGoPrevious = year > minYear;
  const canGoNext = year < maxYear;

  return (
    <View className="mb-3 flex-row items-center justify-center px-global">
      {canGoPrevious ? (
        <Pressable
          onPress={onPrevious}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full border border-neutral-300"
          accessibilityRole="button"
          accessibilityLabel="Previous year">
          <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
        </Pressable>
      ) : null}
      <ThemedText className="min-w-[5rem] text-center text-2xl font-semibold">{year}</ThemedText>
      {canGoNext ? (
        <Pressable
          onPress={onNext}
          className="ml-3 h-10 w-10 items-center justify-center rounded-full border border-neutral-300"
          accessibilityRole="button"
          accessibilityLabel="Next year">
          <Icon name="ChevronRight" size={24} className="translate-x-px" />
        </Pressable>
      ) : null}
    </View>
  );
};

const WalletStatsScreen = () => {
  const colors = useThemeColors();
  const { t, locale } = useTranslation();
  const { apiToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RbCoinsHistoryItem[]>([]);
  const [selectedChartYear, setSelectedChartYear] = useState(() => new Date().getFullYear());
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  const { minYear, maxYear } = useMemo(() => getWalletChartYearBounds(), []);
  const stats = useMemo(
    () => computeRbcWalletStats(history, { locale }),
    [history, locale]
  );
  const chartMonths = useMemo(
    () => computeChartMonthsForYear(history, selectedChartYear, locale),
    [history, selectedChartYear, locale]
  );

  const loadStats = useCallback(async () => {
    if (!apiToken) {
      setHistory([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loadedHistory = await fetchAllRbCoinsHistory(apiToken);
      setHistory(loadedHistory);
      setSelectedChartYear(getWalletChartYearBounds().maxYear);
    } catch (e) {
      setHistory([]);
      setError(e instanceof Error ? e.message : t('commonError'));
    } finally {
      setLoading(false);
    }
  }, [apiToken, t]);

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [loadStats])
  );

  useEffect(() => {
    setSelectedMonthKey(null);
  }, [selectedChartYear]);

  const handleSelectMonth = useCallback((monthKey: string) => {
    setSelectedMonthKey((current) => (current === monthKey ? null : monthKey));
  }, []);

  const displayedTransactions = useMemo(() => {
    if (selectedMonthKey) {
      return filterRbCoinsHistoryByMonth(history, selectedMonthKey);
    }
    return stats.recentTransactions;
  }, [history, selectedMonthKey, stats.recentTransactions]);

  const movesSectionTitle = useMemo(() => {
    if (!selectedMonthKey) return t('walletStatsRecentMoves');
    const monthName = formatMonthName(selectedMonthKey, locale);
    return t('walletStatsMovesInMonth').replace('{month}', monthName);
  }, [selectedMonthKey, locale, t]);

  const hasChartActivity = chartMonths.some((month) => month.received > 0 || month.sent > 0);

  return (
    <>
      <Header title="" showBackButton />
      <ThemedScroller className="flex-1 px-0" keyboardShouldPersistTaps="handled">
        {!apiToken ? (
          <View className="mt-20 px-global">
            <ThemedText className="text-lg text-light-subtext dark:text-dark-subtext">
              {t('walletStatsLoginRequired')}
            </ThemedText>
          </View>
        ) : loading ? (
          <View className="mt-20 items-center px-global">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-3 text-light-subtext dark:text-dark-subtext">
              {t('walletStatsLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="mt-20 px-global">
            <ThemedText className="text-lg text-red-500 dark:text-red-400">{error}</ThemedText>
          </View>
        ) : (
          <>
            <StatsCounter heroMonths={stats.heroMonths} />

            <ChartYearSelector
              year={selectedChartYear}
              minYear={minYear}
              maxYear={maxYear}
              onPrevious={() => {
                setSelectedChartYear((year) => Math.max(RBC_WALLET_MIN_YEAR, year - 1));
              }}
              onNext={() => {
                setSelectedChartYear((year) => Math.min(maxYear, year + 1));
              }}
            />

            <View className="mb-6">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}>
                <GroupedWalletBarChart
                  months={chartMonths}
                  borderColor={colors.border}
                  labelColor={colors.placeholder}
                  selectedMonthKey={selectedMonthKey}
                  onSelectMonth={handleSelectMonth}
                  selectionColor={colors.highlight}
                />
              </ScrollView>
              {!hasChartActivity && (
                <ThemedText className="mt-2 px-global text-center text-sm text-light-subtext dark:text-dark-subtext">
                  {t('walletStatsEmpty')}
                </ThemedText>
              )}
            </View>

            <View className="border-t-8 border-light-secondary px-global pt-global dark:border-dark-secondary">
              <ThemedText className="mb-4 text-2xl font-semibold">{movesSectionTitle}</ThemedText>
              {displayedTransactions.length === 0 ? (
                <ThemedText className="py-2 text-light-subtext dark:text-dark-subtext">
                  {selectedMonthKey ? t('walletStatsEmptyMonth') : t('walletStatsEmpty')}
                </ThemedText>
              ) : (
                displayedTransactions.map((tx) => {
                  const isSent = tx.direction === 'sent';
                  const title = getRbCoinsTransactionListTitle(
                    tx,
                    t,
                    RB_COINS_TX_LIST_KEYS_WALLET
                  );
                  const amountStr = isSent
                    ? `-${formatRbcAmount(tx.amount)}`
                    : `+${formatRbcAmount(tx.amount)}`;
                  return (
                    <RecentMoveRow
                      key={tx.id}
                      status={title}
                      date={formatTransactionDate(tx.createdAt, locale)}
                      amount={amountStr}
                      isSent={isSent}
                    />
                  );
                })
              )}
            </View>
          </>
        )}
      </ThemedScroller>
    </>
  );
};

const RecentMoveRow = (props: {
  status: string;
  date: string;
  amount: string;
  isSent: boolean;
}) => {
  return (
    <View className="my-3 flex-row items-center justify-between">
      <View className="min-w-0 flex-1 pr-4">
        <ThemedText className="text-base opacity-50">{props.status}</ThemedText>
        <ThemedText className="text-lg">{props.date}</ThemedText>
      </View>
      <ThemedText
        className={`text-lg font-semibold ${props.isSent ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
        {props.amount}
      </ThemedText>
    </View>
  );
};

const StatsCounter = ({ heroMonths }: { heroMonths: RbcWalletHeroMonth[] }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  const monthsData = heroMonths.length > 0 ? heroMonths : [];
  const currentData = monthsData[currentMonthIndex] ?? {
    monthKey: '',
    isCurrentMonth: true,
    monthName: '',
    received: 0,
    sent: 0,
  };
  const [displayAmount, setDisplayAmount] = useState(currentData.received);

  useEffect(() => {
    if (monthsData.length === 0) return;
    if (currentMonthIndex >= monthsData.length) {
      setCurrentMonthIndex(0);
    }
  }, [monthsData.length, currentMonthIndex]);

  useEffect(() => {
    const startValue = displayAmount;
    const endValue = currentData.received;

    countAnim.setValue(0);

    const listener = countAnim.addListener(({ value }) => {
      const currentAmount = Math.round(startValue + (endValue - startValue) * value);
      setDisplayAmount(currentAmount);
    });

    Animated.timing(countAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();

    return () => {
      countAnim.removeListener(listener);
    };
  }, [currentMonthIndex, currentData.received]);

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(callback, 200);
  };

  const goToPrevious = () => {
    if (currentMonthIndex < monthsData.length - 1) {
      animateTransition(() => {
        setCurrentMonthIndex(currentMonthIndex + 1);
      });
    }
  };

  const goToNext = () => {
    if (currentMonthIndex > 0) {
      animateTransition(() => {
        setCurrentMonthIndex(currentMonthIndex - 1);
      });
    }
  };

  return (
    <View className="mb-20 mt-14 px-global">
      <ThemedText className="text-5xl font-semibold">{t('walletStatsReceived')}</ThemedText>
      <ThemedText style={{ color: colors.highlight }} className="text-5xl font-semibold">
        +{formatRbcAmount(displayAmount)}
      </ThemedText>
      <View className="flex-row items-center justify-between">
        <Animated.View style={{ opacity: fadeAnim }} className="min-w-0 flex-1 pr-3">
          <ThemedText className="text-5xl font-semibold">{heroMonthLabel(currentData, t)}</ThemedText>
        </Animated.View>
        <View className="flex-row items-center justify-center">
          <Pressable
            onPress={goToPrevious}
            className={`mr-2 h-10 w-10 items-center justify-center rounded-full border border-neutral-300 ${
              currentMonthIndex >= monthsData.length - 1 ? 'opacity-30' : 'opacity-100'
            }`}
            disabled={currentMonthIndex >= monthsData.length - 1}>
            <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
          </Pressable>
          <Pressable
            onPress={goToNext}
            className={`h-10 w-10 items-center justify-center rounded-full border border-neutral-300 ${
              currentMonthIndex <= 0 ? 'opacity-30' : 'opacity-100'
            }`}
            disabled={currentMonthIndex <= 0}>
            <Icon name="ChevronRight" size={24} className="translate-x-px" />
          </Pressable>
        </View>
      </View>
      <ThemedText className="text-lg">
        {spentLineLabel(currentData, t)}{' '}
        <ThemedText className="text-lg font-semibold">
          {formatRbcAmount(currentData.sent)}
        </ThemedText>
      </ThemedText>
    </View>
  );
};

export default WalletStatsScreen;
