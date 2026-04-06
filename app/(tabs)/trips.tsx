import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, TouchableOpacity, ActivityIndicator, Animated, Pressable } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { shadowPresets } from '@/utils/useShadow';
import ThemeScroller from '@/components/ThemeScroller';
import AnimatedView from '@/components/AnimatedView';
import Header, { HeaderIcon } from '@/components/Header';
import { useCollapsibleTitle } from '@/app/hooks/useCollapsibleTitle';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBookingsBadge } from '@/app/contexts/BookingsBadgeContext';
import { getBookings, type Booking } from '@/api/bookings';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { Chip } from '@/components/Chip';
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import LiveIndicator from '@/components/LiveIndicator';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/app/hooks/useTranslation';
import { isReservationIntroCooldownActive } from '@/utils/reservation-intro-cooldown';

type BookingFilter = 'all' | 'current' | 'upcoming' | 'past' | 'cancelled' | 'rated' | 'pending_review';

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
  const sorted = [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
): { current: number; upcoming: number; past: number; cancelled: number; rated: number; pendingReview: number } {
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
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const { refresh: refreshBookingsBadge } = useBookingsBadge();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingReviewMap, setBookingReviewMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>('all');

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
            const withReviews = overview?.data?.reservations?.withReviews as ClientOverviewReservation[] | undefined;
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
          const withReviews = overview?.data?.reservations?.withReviews as ClientOverviewReservation[] | undefined;
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
              router.push(skip ? '/screens/reservation-create' : '/screens/reservation-create-start');
            }}
          />,
        ]}
      />
      <AnimatedView animation="scaleIn" className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">{t('tripsLoading')}</ThemedText>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-6">
            <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
          </View>
        ) : (
          <ThemeScroller
            className="pt-4 px-global"
            onScroll={scrollHandler}
            scrollEventThrottle={scrollEventThrottle}
          >
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
              <ThemedText className="text-center text-light-subtext dark:text-dark-subtext py-8">{t('tripsNoBookings')}</ThemedText>
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
  <View className="w-full mb-3 mt-1">
    <ThemedText className="text-xs font-medium text-light-subtext dark:text-dark-subtext uppercase tracking-wider">{props.year}</ThemedText>
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
  const isCancelled = (booking.status ?? '').toLowerCase() === 'cancelled' || (booking.status ?? '').toLowerCase() === 'canceled';

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
      className={`w-full rounded-2xl mt-4 overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-light-primary dark:bg-dark-primary ${cardOpacity}`}
    >
      <Pressable onPress={goToDetail} className="p-5" android_ripple={null}>
        <View className="flex-row items-center justify-between gap-3 mb-4">
          <View className="flex-row items-center flex-1 min-w-0">
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
            <View className="rounded-full px-2.5 py-1 bg-light-secondary dark:bg-dark-secondary">
              <CountdownDisplay target={getTargetDate(booking)} />
            </View>
          )}
        </View>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <ThemedText className="text-lg font-semibold" numberOfLines={2}>{title}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-0.5">{dateText}</ThemedText>
            {booking.branch?.name ? (
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1" numberOfLines={1}>
                {booking.branch.name}
              </ThemedText>
            ) : null}
          </View>
          <Avatar src={booking.employee?.avatarUrl ?? undefined} name={booking.employee?.name} size="md" />
        </View>
      </Pressable>
      {!isCancelled && (
        <View className="flex-row bg-light-secondary dark:bg-dark-secondary rounded-b-2xl">
          <Button
            variant="ghost"
            size="small"
            title={t('tripsViewBooking')}
            onPress={goToDetail}
            className="flex-1 py-3.5 px-0 rounded-none rounded-bl-2xl"
            textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
          />
          <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
          {isPast && !hasReview ? (
            <Button
              variant="ghost"
              size="small"
              title={t('tripsAddReview')}
              onPress={onOpenReview}
              className="flex-1 py-3.5 px-0 rounded-none rounded-br-2xl"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
          ) : isPast && hasReview ? (
            <TouchableOpacity onPress={onOpenReview} activeOpacity={0.7} className="flex-1 py-3.5 items-center justify-center rounded-br-2xl">
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
              className="flex-1 py-3.5 px-0 rounded-none rounded-br-2xl"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
          ) : (
            <Button
              variant="ghost"
              size="small"
              title={t('tripsMessage')}
              onPress={() => router.push('/screens/chat/user')}
              className="flex-1 py-3.5 px-0 rounded-none rounded-br-2xl"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
          )}
        </View>
      )}
    </View>
  );
};

export default TripsScreen; 