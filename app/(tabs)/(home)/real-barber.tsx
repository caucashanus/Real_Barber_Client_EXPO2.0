import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function getBookingStartDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0, 0
  );
}

function getBookingEndDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0, 0
  );
}

function isBookingNotCancelled(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  return status !== 'cancelled' && status !== 'canceled';
}

function isBookingPast(booking: Booking): boolean {
  if (!isBookingNotCancelled(booking)) return false;
  return getBookingEndDate(booking).getTime() < Date.now();
}

function formatCountdown(ms: number, locale: string): string {
  const totalMin = Math.floor(ms / 60000);
  const prefix = locale.startsWith('cs') ? 'za' : 'in';
  const minLabel = locale.startsWith('cs') ? 'min' : 'min';
  const hourLabel = locale.startsWith('cs') ? 'hod' : 'h';
  if (totalMin < 60) return `${prefix} ${totalMin} ${minLabel}`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (mins === 0) return `${prefix} ${hours} ${hourLabel}`;
  return `${prefix} ${hours} ${hourLabel} ${mins} ${minLabel}`;
}

function formatBookingTime(booking: Booking): string {
  const parts: string[] = [];
  if (booking.date) {
    const [, m, d] = booking.date.slice(0, 10).split('-');
    parts.push(`${d}.${m}.`);
  }
  if (booking.slotStart) parts.push(booking.slotStart);
  return parts.join(' v ');
}

type SpotlightState = 'current' | 'soon' | 'today' | 'upcoming' | 'review';

interface SpotlightBooking {
  booking: Booking;
  state: SpotlightState;
  msUntilStart: number;
}

function getSpotlightBooking(bookings: Booking[], now: number): SpotlightBooking | null {
  const active = bookings.find((b) => {
    if (!isBookingNotCancelled(b)) return false;
    const start = getBookingStartDate(b).getTime();
    const end = getBookingEndDate(b).getTime();
    return start <= now && end >= now;
  });
  if (active) {
    return { booking: active, state: 'current', msUntilStart: 0 };
  }

  const upcoming = bookings
    .filter((b) => {
      if (!isBookingNotCancelled(b)) return false;
      const start = getBookingStartDate(b).getTime();
      return start > now;
    })
    .sort((a, b) => getBookingStartDate(a).getTime() - getBookingStartDate(b).getTime());

  if (upcoming.length > 0) {
    const b = upcoming[0];
    const msUntilStart = getBookingStartDate(b).getTime() - now;
    const startDate = getBookingStartDate(b);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const isToday = startDate >= todayStart && startDate < tomorrowStart;
    let state: SpotlightState;
    if (msUntilStart <= ONE_HOUR_MS) state = 'soon';
    else if (isToday) state = 'today';
    else state = 'upcoming';
    return { booking: b, state, msUntilStart };
  }

  const recentlyEnded = bookings
    .filter((b) => {
      if (!isBookingNotCancelled(b)) return false;
      const status = (b.status ?? '').toLowerCase();
      if (status !== 'completed') return false;
      const end = getBookingEndDate(b).getTime();
      return end < now && now - end <= TWO_DAYS_MS;
    })
    .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime());

  if (recentlyEnded.length > 0) {
    return { booking: recentlyEnded[0], state: 'review', msUntilStart: 0 };
  }

  return null;
}

function SpotlightCard({ spotlight, t, locale }: { spotlight: SpotlightBooking; t: (key: string) => string; locale: string }) {
  const { booking, state, msUntilStart } = spotlight;

  const headerText = () => {
    switch (state) {
      case 'current': return t('homeSpotlightCurrent');
      case 'soon': return t('homeSpotlightSoon');
      case 'today': return t('homeSpotlightToday');
      case 'upcoming': return t('homeSpotlightUpcoming');
      case 'review': return t('homeSpotlightReview');
    }
  };

  const subtitleText = () => {
    switch (state) {
      case 'current': return null;
      case 'soon': return null;
      case 'today': return formatCountdown(msUntilStart, locale);
      case 'upcoming': return null;
      case 'review': return null;
    }
  };

  const showIndicator = state !== 'review';
  const indicatorVariant = state === 'current' ? 'green' : 'orange';
  const subtitle = subtitleText();

  return (
    <Pressable
      onPress={() => {
        if (state === 'review') return;
        router.push(`/screens/trip-detail?id=${encodeURIComponent(booking.id)}` as any);
      }}
      className="active:opacity-70">
      <View style={{ overflow: 'visible' }}>
        <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          {/* Left side indicator strip */}
          <View className="w-1 self-stretch">
            {showIndicator ? (
              <View
                className={`flex-1 rounded-l-2xl ${indicatorVariant === 'green' ? 'bg-green-500 dark:bg-green-400' : 'bg-amber-500 dark:bg-amber-400'}`}
              />
            ) : (
              <View className="flex-1 rounded-l-2xl bg-neutral-300 dark:bg-neutral-600" />
            )}
          </View>
          <View className="flex-row flex-1 items-center gap-3 px-4 py-4">
            <Avatar
              size="md"
              src={booking.employee?.avatarUrl ?? undefined}
              name={booking.employee?.name ?? undefined}
            />
            <View className="min-w-0 flex-1">
              {state === 'review' ? (
                <View>
                  <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                    {headerText()}
                  </ThemedText>
                  <View className="mt-3 flex-row gap-1.5">
                    {[1,2,3,4,5].map((i) => {
                      const imageParam = booking.item?.imageUrl
                        ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}`
                        : '';
                      const employeeNameParam = booking.employee?.name
                        ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}`
                        : '';
                      const employeeAvatarParam = booking.employee?.avatarUrl
                        ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}`
                        : '';
                      return (
                        <Pressable
                          key={i}
                          hitSlop={6}
                          onPress={() =>
                            router.push(
                              `/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? 'Booking')}&presetRating=${i}${imageParam}${employeeNameParam}${employeeAvatarParam}` as any
                            )
                          }>
                          <Icon name="Star" size={30} className="text-neutral-300 dark:text-neutral-600" />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                  {headerText()}
                </ThemedText>
              )}
              {state !== 'review' && (
                <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>
                  {booking.employee?.name ?? '—'} · {booking.branch?.name ?? ''}
                </ThemedText>
              )}
              {subtitle ? (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                    {subtitle}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Icon name="ChevronRight" size={16} className="text-light-subtext dark:text-dark-subtext" />
          </View>
        </View>
        {/* Badge — top right, slightly overlapping */}
        {state === 'current' ? (
          <View
            className="absolute flex-row items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1"
            style={{ top: -8, right: 12 }}>
            <LiveIndicator variant="green" size="sm" />
          </View>
        ) : state === 'review' ? (
          <View
            className="absolute flex-row items-center rounded-full bg-neutral-800 px-2.5 py-1 dark:bg-neutral-200"
            style={{ top: -8, right: 12 }}>
            <ThemedText className="text-xs font-semibold text-white dark:text-neutral-900" numberOfLines={1}>
              {booking.employee?.name ?? '—'}{booking.branch?.name ? ` · ${booking.branch.name}` : ''}
            </ThemedText>
          </View>
        ) : (
          <View
            className="absolute flex-row items-center rounded-full bg-neutral-800 px-2.5 py-1 dark:bg-neutral-200"
            style={{ top: -8, right: 12 }}>
            <ThemedText className="text-xs font-semibold text-white dark:text-neutral-900">
              {state === 'soon' ? formatCountdown(msUntilStart, locale) : formatBookingTime(booking)}
            </ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function RealBarberHomeTab() {
  const { apiToken } = useAuth();
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!apiToken) {
      setAllBookings([]);
      return;
    }
    setRecentLoading(true);
    getBookings(apiToken, { limit: 50, offset: 0 })
      .then((res) => setAllBookings(res.bookings ?? []))
      .catch(() => setAllBookings([]))
      .finally(() => setRecentLoading(false));
  }, [apiToken]);

  const spotlight = useMemo(() => getSpotlightBooking(allBookings, now), [allBookings, now]);

  const recentBookings = useMemo(
    () =>
      allBookings
        .filter(isBookingPast)
        .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())
        .slice(0, 3),
    [allBookings]
  );

  return (
    <ThemeScroller className="flex-1">
      <View className="mt-4 px-global">
        {/* Spotlight booking */}
        {recentLoading ? null : spotlight ? (
          <View className="-mx-global mt-4">
            <SpotlightCard spotlight={spotlight} t={t} locale={locale} />
          </View>
        ) : null}

        {/* Quick actions grid (2x2) */}
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
                    resizeMode="contain"
                    className="mb-2"
                  />
                )}
                {a.id === 'branches' && (
                  <Image
                    source={require('@/assets/img/search-modal-branches.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                    className="mb-2"
                  />
                )}
                {a.id === 'barbers' && (
                  <Image
                    source={require('@/assets/img/barbers.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                    className="mb-2"
                  />
                )}
                {a.id === 'bookings' && (
                  <Image
                    source={require('@/assets/img/search-modal-bookings.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
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

        {/* Recent bookings */}
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
                        {formatBookingTime(b)}
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
