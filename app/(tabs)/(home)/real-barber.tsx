import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';

import { getBookings, type Booking } from '@/api/bookings';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import { HomeSpotlightCard } from '@/components/HomeSpotlightCard';
import Icon from '@/components/Icon';
import NotificationPromptSheet from '@/components/NotificationPromptSheet';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { getBookingEndDate, isBookingPast } from '@/utils/bookingHelpers';
import { pickHomeSpotlight, formatHomeBookingSlotLabel } from '@/utils/homeSpotlight';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';
import { shadowPresets } from '@/utils/useShadow';

const HOME_PROMO_DISMISSED_KEY = 'real_barber_home_promo_dismissed';
const HOME_PROMO_HIDE_MS = 24 * 60 * 60 * 1000;

type HomePromoDef = {
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  nav: 'create' | 'path';
  path?: string;
};

const HOME_PROMO_CARDS: HomePromoDef[] = [
  { titleKey: 'productsPromoTitle', subtitleKey: 'productsPromoSubtitle', nav: 'create' },
  { titleKey: 'productsPromoTitle2', subtitleKey: 'productsPromoSubtitle2', nav: 'path', path: '/products' },
  { titleKey: 'productsPromoTitle3', subtitleKey: 'productsPromoSubtitle3', nav: 'path', path: '/branches' },
  { titleKey: 'productsPromoTitle4', subtitleKey: 'productsPromoSubtitle4', nav: 'path', path: '/wallet' },
  { titleKey: 'productsPromoTitle5', subtitleKey: 'productsPromoSubtitle5', nav: 'path', path: '/guides' },
];

export default function RealBarberHomeTab() {
  const { apiToken } = useAuth();
  const { accentColor } = useAccentColor();
  const { t, locale } = useTranslation();
  const actions = useMemo(
    () => [
      {
        id: 'create',
        title: t('homeCreateBooking'),
        subtitle: t('homeCreateBookingSubtitle'),
        icon: 'Scissors',
        onPress: async () => {
          const suppressed = await isReservationIntroCooldownActive();
          router.push(
            suppressed ? '/screens/reservation-create' : '/screens/reservation-create-start'
          );
        },
      },
      {
        id: 'branches',
        title: t('homeBranches'),
        subtitle: t('homeBranchesSubtitle'),
        icon: 'MapPin',
        onPress: () => router.push('/branches' as any),
      },
      {
        id: 'barbers',
        title: t('homeBarbers'),
        subtitle: t('homeBarbersSubtitle'),
        icon: 'Users',
        onPress: () => router.push('/experience' as any),
      },
      {
        id: 'bookings',
        title: t('homeBookings'),
        subtitle: t('homeBookingsSubtitle'),
        icon: 'Calendar',
        onPress: () => router.push('/trips' as any),
      },
    ],
    [t]
  );

  const [recentLoading, setRecentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [dismissedPromoAt, setDismissedPromoAt] = useState<Record<number, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HOME_PROMO_DISMISSED_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed: Record<string, number> = JSON.parse(raw);
        const nowMs = Date.now();
        const next: Record<number, number> = {};
        Object.entries(parsed).forEach(([k, ts]) => {
          const idx = Number(k);
          if (nowMs - ts < HOME_PROMO_HIDE_MS) next[idx] = ts;
        });
        setDismissedPromoAt(next);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const handleDismissPromo = (index: number) => {
    const ts = Date.now();
    setDismissedPromoAt((prev) => {
      const next = { ...prev, [index]: ts };
      AsyncStorage.setItem(HOME_PROMO_DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const visiblePromoCards = useMemo(
    () =>
      HOME_PROMO_CARDS.map((def, index) => ({ def, index })).filter(({ index }) => {
        const at = dismissedPromoAt[index];
        if (!at) return true;
        return now - at >= HOME_PROMO_HIDE_MS;
      }),
    [dismissedPromoAt, now]
  );

  const openPromoNav = async (def: HomePromoDef) => {
    if (def.nav === 'create') {
      const suppressed = await isReservationIntroCooldownActive();
      router.push(suppressed ? '/screens/reservation-create' : '/screens/reservation-create-start');
      return;
    }
    if (def.path) router.push(def.path as any);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!apiToken) {
      setAllBookings([]);
      return;
    }
    try {
      const res = await getBookings(apiToken, { limit: 50, offset: 0 });
      setAllBookings(res.bookings);
    } catch {
      setAllBookings([]);
    }
  }, [apiToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    setRecentLoading(true);
    loadData().finally(() => setRecentLoading(false));
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      void getBookings(apiToken, { limit: 50, offset: 0 })
        .then((res) => setAllBookings(res.bookings))
        .catch(() => {});
    }, [apiToken])
  );

  const spotlight = useMemo(() => pickHomeSpotlight(allBookings, now), [allBookings, now]);

  const recentBookings = useMemo(
    () =>
      allBookings
        .filter(isBookingPast)
        .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
        .slice(0, 3),
    [allBookings]
  );

  return (
    <ThemeScroller className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}>
      <NotificationPromptSheet />
      <View className="mt-4 px-global">
        {recentLoading ? null : spotlight ? (
          <View className="-mx-global mt-4">
            <HomeSpotlightCard spotlight={spotlight} t={t} locale={locale} />
          </View>
        ) : null}

        {visiblePromoCards.length > 0 ? (
          <View className="-mx-global mt-6">
            <Section title={t('homePromoSectionTitle')} titleSize="md" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-global"
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingRight: 24,
                paddingTop: 8,
                paddingBottom: 4,
              }}>
              {visiblePromoCards.map(({ def, index }) => (
                <View
                  key={index}
                  style={[shadowPresets.large, { width: 280, marginRight: 15 }]}
                  className="relative flex-shrink-0 overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
                  <Pressable
                    onPress={() => void openPromoNav(def)}
                    className="p-5 pr-10 active:opacity-90">
                    <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">
                      {t(def.titleKey)}
                    </ThemedText>
                    <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                      {t(def.subtitleKey)}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    className="absolute right-2 top-2 rounded-full p-1.5 active:opacity-70"
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('commonCancel')}
                    onPress={() => handleDismissPromo(index)}>
                    <Icon
                      name="X"
                      size={18}
                      className="text-light-subtext dark:text-dark-subtext"
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="-mx-global mt-4 flex-row flex-wrap justify-between px-0">
          {actions.map((a) => (
            <Pressable
              key={a.id}
              onPress={a.onPress}
              className="mb-2 w-[48.7%] rounded-2xl bg-light-secondary dark:bg-dark-secondary">
              <View className="items-center p-4">
                {a.id === 'create' && (
                  <Image
                    source={require('@/assets/img/plus-ikon.png')}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                    className="mb-2"
                  />
                )}
                {a.id === 'branches' && (
                  <Image
                    source={require('@/assets/img/search-modal-branches.png')}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                    className="mb-2"
                  />
                )}
                {a.id === 'barbers' && (
                  <Image
                    source={require('@/assets/img/barbers.png')}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                    className="mb-2"
                  />
                )}
                {a.id === 'bookings' && (
                  <Image
                    source={require('@/assets/img/search-modal-bookings.png')}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                    className="mb-2"
                  />
                )}
                <ThemedText className="text-base font-semibold">{a.title}</ThemedText>
                <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
                  {a.subtitle}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>

        <Section title={t('homeRecentTitle')} titleSize="md" className="mt-6" />
        {recentLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" />
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {t('homeRecentLoading')}
            </ThemedText>
          </View>
        ) : recentBookings.length === 0 ? (
          <View className="py-4">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('homeRecentEmpty')}
            </ThemedText>
          </View>
        ) : (
          <View className="-mx-global overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
            {recentBookings.map((b, i) => (
              <Pressable
                key={b.id}
                onPress={() =>
                  router.push(`/screens/trip-detail?id=${encodeURIComponent(b.id)}` as any)
                }
                className="active:opacity-70">
                {i > 0 && (
                  <View className="mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />
                )}
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <Avatar
                    size="md"
                    src={b.employee?.avatarUrl ?? undefined}
                    name={b.employee?.name ?? undefined}
                  />
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                      {b.item?.name ?? t('homeRecentDefaultName')}
                    </ThemedText>
                    <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>
                      {b.employee?.name ?? '—'} · {b.branch?.name ?? ''}
                    </ThemedText>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Icon name="Calendar" size={11} className="text-light-subtext dark:text-dark-subtext" />
                      <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                        {formatHomeBookingSlotLabel(b)}
                      </ThemedText>
                    </View>
                  </View>
                  <Icon name="ChevronRight" size={16} className="text-light-subtext dark:text-dark-subtext" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ThemeScroller>
  );
}
