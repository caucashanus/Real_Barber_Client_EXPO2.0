import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { getClientOverview } from '@/api/reviews';
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
import { getBookingEndDate, isBookingPast } from '@/utils/bookingHelpers';
import { pickHomeSpotlight, formatHomeBookingSlotLabel } from '@/utils/homeSpotlight';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

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
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    await Promise.allSettled([
      getBookings(apiToken, { limit: 50, offset: 0 })
        .then((res) => setAllBookings(res.bookings))
        .catch(() => setAllBookings([])),
      getClientOverview(apiToken)
        .then((overview) => {
          const ids = new Set<string>();
          (overview.data?.reservations?.withReviews ?? []).forEach((r) => ids.add(r.id));
          setReviewedBookingIds(ids);
        })
        .catch(() => {}),
    ]);
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

  const spotlight = useMemo(
    () => pickHomeSpotlight(allBookings, now, reviewedBookingIds),
    [allBookings, now, reviewedBookingIds]
  );

  const recentBookings = useMemo(
    () =>
      allBookings
        .filter(isBookingPast)
        .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
        .slice(0, 3),
    [allBookings]
  );

  return (
    <ThemeScroller
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
      }>
      <NotificationPromptSheet />
      <View className="mt-4 px-global">
        {recentLoading ? null : spotlight ? (
          <View className="-mx-global mt-4">
            <HomeSpotlightCard spotlight={spotlight} t={t} locale={locale} />
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
                {i > 0 && <View className="mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />}
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
                    <ThemedText
                      className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext"
                      numberOfLines={1}>
                      {b.employee?.name ?? '—'} · {b.branch?.name ?? ''}
                    </ThemedText>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Icon
                        name="Calendar"
                        size={11}
                        className="text-light-subtext dark:text-dark-subtext"
                      />
                      <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                        {formatHomeBookingSlotLabel(b)}
                      </ThemedText>
                    </View>
                  </View>
                  <Icon
                    name="ChevronRight"
                    size={16}
                    className="text-light-subtext dark:text-dark-subtext"
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ThemeScroller>
  );
}
