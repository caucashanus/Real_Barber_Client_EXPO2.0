import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Pressable,
  Platform,
} from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { registerActivityKitPushToken } from '@/api/live-activity-push';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBookingsBadge } from '@/app/contexts/BookingsBadgeContext';
import { useCollapsibleTitle } from '@/app/hooks/useCollapsibleTitle';
import AnimatedView from '@/components/AnimatedView';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { shadowPresets } from '@/utils/useShadow';
import Header, { HeaderIcon } from '@/components/Header';
import {
  type RBLiveActivityHandle,
  rbLiveActivityStart,
  rbLiveActivityWaitForPushToken,
} from '@/lib/rb-live-activity';
import { Chip } from '@/components/Chip';
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import LiveIndicator from '@/components/LiveIndicator';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useTranslation } from '@/app/hooks/useTranslation';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

type BookingFilter =
  | 'all'
  | 'current'
  | 'upcoming'
  | 'past'
  | 'cancelled'
  | 'rated'
  | 'pending_review';

// During design/debug, prevent auto-start from creating extra instances.
// Live Activities should be started from Dev Live Activity screen in __DEV__.
const ENABLE_AUTO_LIVE_ACTIVITY = !__DEV__;

function formatBookingDate(b: Booking, locale: string = 'en'): string {
  const d = new Date(b.date);
  const dateLocale = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const day = d.getDate();
  const month = d.toLocaleString(dateLocale, { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}, ${b.slotStart} - ${b.slotEnd}`;
}

function groupBookingsByYear(bookings: Booking[]): Record<string, Booking[]> {
  const byYear: Record<string, Booking[]> = {};
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const b of sorted) {
    const year = String(new Date(b.date).getFullYear());
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(b);
  }
  return byYear;
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
    0,
    0
  );
}

function getTargetDate(booking: Booking): Date {
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
    0,
    0
  );
}

/** Readable slot line for Live Activity (today → only times, else short weekday + date). */
function formatLiveActivityTimeLine(booking: Booking, locale: string): string {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateLocale = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const bookingDay = new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1
  );
  const now = new Date();
  const sameCalendarDay =
    bookingDay.getFullYear() === now.getFullYear() &&
    bookingDay.getMonth() === now.getMonth() &&
    bookingDay.getDate() === now.getDate();
  const timePart = `${booking.slotStart}–${booking.slotEnd}`;
  if (sameCalendarDay) return timePart;
  const dayLabel = bookingDay.toLocaleString(dateLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${dayLabel} · ${timePart}`;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function isBookingPast(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return false;
  return getBookingEndDate(booking).getTime() < Date.now();
}

function isBookingCurrent(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return false;
  const now = Date.now();
  const start = getTargetDate(booking).getTime();
  const end = getBookingEndDate(booking).getTime();
  return start <= now && end >= now;
}

function isBookingUpcoming(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return false;
  return getTargetDate(booking).getTime() > Date.now();
}

function countByFilter(
  bookings: Booking[],
  bookingReviewMap: Record<string, number>
): {
  current: number;
  upcoming: number;
  past: number;
  cancelled: number;
  rated: number;
  pendingReview: number;
} {
  const now = Date.now();
  let current = 0;
  let upcoming = 0;
  let past = 0;
  let cancelled = 0;
  let rated = 0;
  let pendingReview = 0;
  for (const b of bookings) {
    const status = (b.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') {
      cancelled += 1;
    } else {
      const start = getTargetDate(b).getTime();
      const end = getBookingEndDate(b).getTime();
      if (start <= now && end >= now) {
        current += 1;
      } else if (start > now) {
        upcoming += 1;
      } else {
        past += 1;
        if (bookingReviewMap[b.id] != null) {
          rated += 1;
        } else {
          pendingReview += 1;
        }
      }
    }
  }
  return { current, upcoming, past, cancelled, rated, pendingReview };
}

type CountdownParts =
  | { type: 'days'; days: number }
  | { type: 'hours'; hours: number; minutes: number }
  | { type: 'minutes'; minutes: number; seconds: number };

function getCountdownParts(target: Date): CountdownParts | null {
  const now = Date.now();
  const ms = target.getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  if (!Number.isFinite(totalMinutes)) return null;
  if (days >= 3) return { type: 'days', days };
  if (totalHours >= 1) return { type: 'hours', hours: totalHours, minutes: totalMinutes % 60 };
  const totalSeconds = Math.floor(ms / 1000);
  return { type: 'minutes', minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value === prevValue.current) return;
    const startValue = prevValue.current;
    prevValue.current = value;
    countAnim.setValue(0);
    const listener = countAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(startValue + (value - startValue) * v));
    });
    Animated.timing(countAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    return () => {
      countAnim.removeListener(listener);
    };
  }, [value]);

  const safe = Number.isFinite(displayValue) ? displayValue : 0;
  return <ThemedText className={className}>{safe}</ThemedText>;
};

const CountdownDisplay = ({ target }: { target: Date }) => {
  const { t } = useTranslation();
  const [parts, setParts] = useState<CountdownParts | null>(() => getCountdownParts(target));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);

  if (!parts) return null;

  const textClass = 'text-sm text-light-subtext dark:text-dark-subtext';

  if (parts.type === 'days') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>{t('tripsIn')} </ThemedText>
        <AnimatedNumber value={parts.days} className={textClass} />
        <ThemedText className={textClass}> {t('tripsDays')}</ThemedText>
      </View>
    );
  }
  if (parts.type === 'hours') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>{t('tripsIn')} </ThemedText>
        <AnimatedNumber value={parts.hours} className={textClass} />
        <ThemedText className={textClass}> {t('tripsHours')} </ThemedText>
        <AnimatedNumber value={parts.minutes} className={textClass} />
        <ThemedText className={textClass}> {t('tripsMinutes')}</ThemedText>
      </View>
    );
  }
  return (
    <View className="flex-row items-center">
      <AnimatedNumber value={parts.minutes} className={textClass} />
      <ThemedText className={textClass}> {t('tripsMinutes')} </ThemedText>
      <AnimatedNumber value={parts.seconds} className={textClass} />
      <ThemedText className={textClass}> {t('tripsSeconds')}</ThemedText>
    </View>
  );
};

const TripsScreen = () => {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { accentColor } = useAccentColor();
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const { refresh: refreshBookingsBadge } = useBookingsBadge();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingReviewMap, setBookingReviewMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>('all');
  const liveInstanceRef = useRef<RBLiveActivityHandle | null>(null);
  const liveBookingIdRef = useRef<string | null>(null);

  const counts = countByFilter(bookings, bookingReviewMap);

  const filteredBookings =
    selectedFilter === 'all'
      ? bookings
      : selectedFilter === 'current'
        ? bookings.filter((b) => isBookingCurrent(b))
        : selectedFilter === 'upcoming'
          ? bookings.filter((b) => isBookingUpcoming(b))
          : selectedFilter === 'past'
            ? bookings.filter((b) => isBookingPast(b))
            : selectedFilter === 'cancelled'
              ? bookings.filter((b) => {
                  const status = (b.status ?? '').toLowerCase();
                  return status === 'cancelled' || status === 'canceled';
                })
              : selectedFilter === 'rated'
                ? bookings.filter((b) => isBookingPast(b) && bookingReviewMap[b.id] != null)
                : selectedFilter === 'pending_review'
                  ? bookings.filter((b) => isBookingPast(b) && bookingReviewMap[b.id] == null)
                  : bookings;

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      setBookingReviewMap({});
      return;
    }
    setLoading(true);
    setError(null);
    getBookings(apiToken)
      .then((res) => {
        setBookings(res.bookings);
        refreshBookingsBadge();
        getClientOverview(apiToken)
          .then((overview) => {
            const map: Record<string, number> = {};
            const withReviews = overview?.data?.reservations?.withReviews as
              | ClientOverviewReservation[]
              | undefined;
            if (Array.isArray(withReviews)) {
              withReviews.forEach((res) => {
                const id = res.id;
                const review = res.reviews?.[0];
                if (id && review?.rating != null) map[id] = review.rating;
              });
            }
            setBookingReviewMap(map);
          })
          .catch(() => setBookingReviewMap({}));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, refreshBookingsBadge]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!ENABLE_AUTO_LIVE_ACTIVITY) return;

    const current = bookings.find((b) => isBookingCurrent(b)) ?? null;
    const upcomingInHour =
      bookings
        .filter((b) => isBookingUpcoming(b))
        .map((b) => ({ b, t: getTargetDate(b).getTime() }))
        .filter(({ t }) => t - Date.now() <= 60 * 60_000 && t - Date.now() > 0)
        .sort((a, c) => a.t - c.t)[0]?.b ?? null;

    const target = current ?? upcomingInHour;
    if (!target) {
      const prev = liveInstanceRef.current;
      liveInstanceRef.current = null;
      liveBookingIdRef.current = null;
      if (prev) void prev.end().catch(() => {});
      return;
    }

    const start = getTargetDate(target);
    const end = getBookingEndDate(target);
    const bookingId = target.id;
    const now = Date.now();
    const startMs = start.getTime();
    const endMs = end.getTime();
    const isCurrent = isBookingCurrent(target);
    const detailLine = formatLiveActivityTimeLine(target, locale);
    const branchName = target.branch?.name ?? '';

    let subtitle: string;
    let title: string;
    let progress01: number;

    if (isCurrent) {
      const slotMs = Math.max(60_000, endMs - startMs);
      const minutesLeft = Math.max(1, Math.ceil((endMs - now) / 60_000));
      subtitle = t('liveActivityEndsInLabel');
      title = `${minutesLeft} ${t('tripsMinutes')}`;
      progress01 = clamp01((now - startMs) / slotMs);
    } else {
      const minutesUntil = Math.max(1, Math.ceil((startMs - now) / 60_000));
      subtitle = t('liveActivityStartsInLabel');
      title = `${minutesUntil} ${t('tripsMinutes')}`;
      progress01 = clamp01(1 - (startMs - now) / (60 * 60 * 1000));
    }

    void (async () => {
      try {
        const payload = {
          subtitle,
          title,
          detailLine,
          branchName: branchName || undefined,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          progress01,
          accentHex: accentColor,
        };
        const deepLink = `realbarber://screens/trip-detail?id=${encodeURIComponent(bookingId)}&openReview=1`;
        const isNewForBooking = !liveInstanceRef.current || liveBookingIdRef.current !== bookingId;
        if (isNewForBooking) {
          liveBookingIdRef.current = bookingId;
          liveInstanceRef.current = await rbLiveActivityStart(payload, deepLink);
          const handle = liveInstanceRef.current;
          if (apiToken && handle) {
            const activityId = handle.id;
            void (async () => {
              const pushToken = await rbLiveActivityWaitForPushToken(activityId);
              if (!pushToken) return;
              try {
                await registerActivityKitPushToken(apiToken, {
                  bookingId,
                  activityId,
                  pushToken,
                });
              } catch {
                // CRM může endpoint ještě nemít — Live Activity v appce funguje i bez registrace.
              }
            })();
          }
        } else {
          await liveInstanceRef.current!.update(payload);
        }
      } catch {
        // Live Activity optional / permissions / simulator
      }
    })();
  }, [bookings, locale, t, accentColor, apiToken]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      getBookings(apiToken)
        .then((res) => {
          setBookings(res.bookings);
          refreshBookingsBadge();
          return getClientOverview(apiToken);
        })
        .then((overview) => {
          const map: Record<string, number> = {};
          const withReviews = overview?.data?.reservations?.withReviews as
            | ClientOverviewReservation[]
            | undefined;
          if (Array.isArray(withReviews)) {
            withReviews.forEach((res) => {
              const id = res.id;
              const review = res.reviews?.[0];
              if (id && review?.rating != null) map[id] = review.rating;
            });
          }
          setBookingReviewMap(map);
        })
        .catch(() => {});
    }, [apiToken, refreshBookingsBadge])
  );

  const byYear = groupBookingsByYear(filteredBookings);
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        title={t('tripsTitle')}
        variant="collapsibleTitle"
        scrollY={scrollY}
        collapsibleTitleExpandedFontSize={36}
        collapsibleTitleCollapsedFontSize={20}
        rightComponents={[
          <HeaderIcon
            key="add-booking"
            icon="PlusCircle"
            href="/screens/reservation-create-start"
            iconSize={28}
            onPress={async () => {
              const skip = await isReservationIntroCooldownActive();
              router.push(
                skip ? '/screens/reservation-create' : '/screens/reservation-create-start'
              );
            }}
          />,
        ]}
      />
      <AnimatedView animation="scaleIn" className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
              {t('tripsLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-6">
            <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
          </View>
        ) : (
          <ThemeScroller
            className="px-global pt-4"
            onScroll={scrollHandler}
            scrollEventThrottle={scrollEventThrottle}>
            <CardScroller className="mb-4">
              {counts.current > 0 && (
                <Chip
                  size="lg"
                  label={`${t('tripsFilterCurrent')} (${counts.current})`}
                  selectable
                  isSelected={selectedFilter === 'current'}
                  onPress={() => setSelectedFilter('current')}
                />
              )}
              <Chip
                size="lg"
                label={t('tripsFilterAll')}
                selectable
                isSelected={selectedFilter === 'all'}
                onPress={() => setSelectedFilter('all')}
              />
              {counts.upcoming > 0 && (
                <Chip
                  size="lg"
                  label={`${t('tripsFilterUpcoming')} (${counts.upcoming})`}
                  selectable
                  isSelected={selectedFilter === 'upcoming'}
                  onPress={() => setSelectedFilter('upcoming')}
                />
              )}
              <Chip
                size="lg"
                label={t('tripsFilterPast')}
                selectable
                isSelected={selectedFilter === 'past'}
                onPress={() => setSelectedFilter('past')}
              />
              <Chip
                size="lg"
                label={`${t('tripsFilterCancelled')} (${counts.cancelled})`}
                selectable
                isSelected={selectedFilter === 'cancelled'}
                onPress={() => setSelectedFilter('cancelled')}
              />
              <Chip
                size="lg"
                label={`${t('tripsFilterRated')} (${counts.rated})`}
                selectable
                isSelected={selectedFilter === 'rated'}
                onPress={() => setSelectedFilter('rated')}
              />
              <Chip
                size="lg"
                label={`${t('tripsFilterPendingReview')} (${counts.pendingReview})`}
                selectable
                isSelected={selectedFilter === 'pending_review'}
                onPress={() => setSelectedFilter('pending_review')}
              />
            </CardScroller>
            {years.length === 0 ? (
              <ThemedText className="py-8 text-center text-light-subtext dark:text-dark-subtext">
                {t('tripsNoBookings')}
              </ThemedText>
            ) : (
              years.map((year, index) => (
                <View key={year}>
                  {index > 0 && <YearDivider year={year} />}
                  {byYear[year].map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      dateText={formatBookingDate(booking, locale)}
                      reviewRating={bookingReviewMap[booking.id]}
                      onOpenReview={() => {
                        const imageParam = booking.item?.imageUrl
                          ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}`
                          : '';
                        const employeeNameParam = booking.employee?.name
                          ? `&entityEmployeeName=${encodeURIComponent(booking.employee.name)}`
                          : '';
                        const employeeAvatarParam = booking.employee?.avatarUrl
                          ? `&entityEmployeeAvatar=${encodeURIComponent(booking.employee.avatarUrl)}`
                          : '';
                        router.push(
                          `/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? 'Booking')}${imageParam}${employeeNameParam}${employeeAvatarParam}`
                        );
                      }}
                    />
                  ))}
                </View>
              ))
            )}
          </ThemeScroller>
        )}
      </AnimatedView>
    </View>
  );
};

const YearDivider = (props: { year: string }) => (
  <View className="mb-3 mt-1 w-full">
    <ThemedText className="text-xs font-medium uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
      {props.year}
    </ThemedText>
  </View>
);

function isPastAndNotCancelled(booking: Booking): boolean {
  return isBookingPast(booking);
}

const BookingCard = (props: {
  booking: Booking;
  dateText: string;
  reviewRating?: number;
  onOpenReview?: () => void;
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { booking, dateText, reviewRating, onOpenReview } = props;
  const title = booking.item?.name ?? 'Booking';
  const isPast = isPastAndNotCancelled(booking);
  const isCurrent = isBookingCurrent(booking);
  const isUpcoming = isBookingUpcoming(booking);
  const hasReview = reviewRating != null && reviewRating >= 1;
  const isCancelled =
    (booking.status ?? '').toLowerCase() === 'cancelled' ||
    (booking.status ?? '').toLowerCase() === 'canceled';

  const getStatusText = () => {
    if (isCancelled) return t('bookingStatusCancelled');
    if (isCurrent) return t('bookingStatusInProgress');
    if (isPast) return t('bookingStatusPast');
    return t('bookingStatusUpcoming');
  };

  const getStatusPillClass = () => {
    if (isCancelled) return 'bg-red-100 dark:bg-red-900/30';
    if (isCurrent) return 'bg-green-100 dark:bg-green-900/30';
    if (isPast) return 'bg-neutral-100 dark:bg-neutral-800';
    return 'bg-neutral-100 dark:bg-neutral-800';
  };

  const getStatusTextClass = () => {
    if (isCancelled) return 'text-red-700 dark:text-red-300';
    if (isCurrent) return 'text-green-700 dark:text-green-300';
    if (isPast) return 'text-neutral-600 dark:text-neutral-400';
    return 'text-neutral-700 dark:text-neutral-300';
  };

  const cardOpacity = isCancelled ? 'opacity-70' : 'opacity-100';

  const goToDetail = () => router.push(`/screens/trip-detail?id=${booking.id}`);

  return (
    <View
      style={shadowPresets.card}
      className={`mt-4 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-light-primary dark:border-neutral-700 dark:bg-dark-primary ${cardOpacity}`}>
      <Pressable onPress={goToDetail} className="p-5" android_ripple={null}>
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center">
            <View className={`rounded-full px-2.5 py-1 ${getStatusPillClass()}`}>
              <ThemedText className={`text-xs font-semibold ${getStatusTextClass()}`}>
                {getStatusText()}
              </ThemedText>
            </View>
            {isCurrent && (
              <View className="ml-2">
                <LiveIndicator />
              </View>
            )}
          </View>
          {isUpcoming && (
            <View className="rounded-full bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary">
              <CountdownDisplay target={getTargetDate(booking)} />
            </View>
          )}
        </View>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <ThemedText className="text-lg font-semibold" numberOfLines={2}>
              {title}
            </ThemedText>
            <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
              {dateText}
            </ThemedText>
            {booking.branch?.name ? (
              <ThemedText
                className="mt-1 text-xs text-light-subtext dark:text-dark-subtext"
                numberOfLines={1}>
                {booking.branch.name}
              </ThemedText>
            ) : null}
          </View>
          <Avatar
            src={booking.employee?.avatarUrl ?? undefined}
            name={booking.employee?.name}
            size="md"
          />
        </View>
      </Pressable>
      {!isCancelled && (
        <View className="flex-row rounded-b-2xl bg-light-secondary dark:bg-dark-secondary">
          <Button
            variant="ghost"
            size="small"
            title={t('tripsViewBooking')}
            onPress={goToDetail}
            className="flex-1 rounded-none rounded-bl-2xl px-0 py-3.5"
            textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
          />
          <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
          {isPast && !hasReview ? (
            <Button
              variant="ghost"
              size="small"
              title={t('tripsAddReview')}
              onPress={onOpenReview}
              className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
          ) : isPast && hasReview ? (
            <TouchableOpacity
              onPress={onOpenReview}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center rounded-br-2xl py-3.5">
              <ShowRating rating={reviewRating!} size="sm" displayMode="stars" />
            </TouchableOpacity>
          ) : isUpcoming ? (
            <Button
              variant="ghost"
              size="small"
              title={t('tripDetailMoveButton')}
              iconStart="Calendar"
              iconSize={16}
              onPress={() =>
                router.push(`/screens/reschedule?id=${encodeURIComponent(booking.id)}`)
              }
              className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
          ) : (
            <Button
              variant="ghost"
              size="small"
              title={t('tripsMessage')}
              onPress={() => router.push('/screens/chat/user')}
              className="flex-1 rounded-none rounded-br-2xl px-0 py-3.5"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
          )}
        </View>
      )}
    </View>
  );
};

export default TripsScreen;
