import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Image, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { Link } from 'expo-router';
import { shadowPresets } from '@/utils/useShadow';
import ThemeScroller from '@/components/ThemeScroller';
import AnimatedView from '@/components/AnimatedView';
import Header from '@/components/Header';
import { useCollapsibleTitle } from '@/app/hooks/useCollapsibleTitle';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBookings, type Booking } from '@/api/bookings';
import { getClientOverview, type ClientOverviewReservation } from '@/api/reviews';
import { Chip } from '@/components/Chip';
import { CardScroller } from '@/components/CardScroller';
import ShowRating from '@/components/ShowRating';
import { useRouter } from 'expo-router';

type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled' | 'rated' | 'pending_review';

function formatBookingDate(b: Booking): string {
  const d = new Date(b.date);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
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

function isBookingPast(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return false;
  return getBookingEndDate(booking).getTime() < Date.now();
}

function countByFilter(
  bookings: Booking[],
  bookingReviewMap: Record<string, number>
): { upcoming: number; past: number; cancelled: number; rated: number; pendingReview: number } {
  const now = Date.now();
  let upcoming = 0;
  let past = 0;
  let cancelled = 0;
  let rated = 0;
  let pendingReview = 0;
  for (const b of bookings) {
    const status = (b.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') {
      cancelled += 1;
    } else if (getBookingEndDate(b).getTime() > now) {
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
  return { upcoming, past, cancelled, rated, pendingReview };
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
        <ThemedText className={textClass}>Za </ThemedText>
        <AnimatedNumber value={parts.days} className={textClass} />
        <ThemedText className={textClass}> dní</ThemedText>
      </View>
    );
  }
  if (parts.type === 'hours') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>Za </ThemedText>
        <AnimatedNumber value={parts.hours} className={textClass} />
        <ThemedText className={textClass}> h </ThemedText>
        <AnimatedNumber value={parts.minutes} className={textClass} />
        <ThemedText className={textClass}> min</ThemedText>
      </View>
    );
  }
  return (
    <View className="flex-row items-center">
      <AnimatedNumber value={parts.minutes} className={textClass} />
      <ThemedText className={textClass}> min </ThemedText>
      <AnimatedNumber value={parts.seconds} className={textClass} />
      <ThemedText className={textClass}> s</ThemedText>
    </View>
  );
};

const TripsScreen = () => {
  const router = useRouter();
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingReviewMap, setBookingReviewMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>('all');

  const counts = countByFilter(bookings, bookingReviewMap);

  const filteredBookings =
    selectedFilter === 'all'
      ? bookings
      : selectedFilter === 'upcoming'
        ? bookings.filter((b) => !isBookingPast(b))
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
  }, [apiToken]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) return;
      getBookings(apiToken)
        .then((res) => {
          setBookings(res.bookings);
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
    }, [apiToken])
  );

  const byYear = groupBookingsByYear(filteredBookings);
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        title="Your Bookings"
        variant="collapsibleTitle"
        scrollY={scrollY}
      />
      <AnimatedView animation="scaleIn" className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
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
              <Chip
                size="lg"
                label="All"
                selectable
                isSelected={selectedFilter === 'all'}
                onPress={() => setSelectedFilter('all')}
              />
              <Chip
                size="lg"
                label={`Upcoming (${counts.upcoming})`}
                selectable
                isSelected={selectedFilter === 'upcoming'}
                onPress={() => setSelectedFilter('upcoming')}
              />
              <Chip
                size="lg"
                label="Past"
                selectable
                isSelected={selectedFilter === 'past'}
                onPress={() => setSelectedFilter('past')}
              />
              <Chip
                size="lg"
                label={`Cancelled (${counts.cancelled})`}
                selectable
                isSelected={selectedFilter === 'cancelled'}
                onPress={() => setSelectedFilter('cancelled')}
              />
              <Chip
                size="lg"
                label={`Rated (${counts.rated})`}
                selectable
                isSelected={selectedFilter === 'rated'}
                onPress={() => setSelectedFilter('rated')}
              />
              <Chip
                size="lg"
                label={`Pending review (${counts.pendingReview})`}
                selectable
                isSelected={selectedFilter === 'pending_review'}
                onPress={() => setSelectedFilter('pending_review')}
              />
            </CardScroller>
            {years.length === 0 ? (
              <ThemedText className="text-center text-light-subtext dark:text-dark-subtext py-8">No bookings yet.</ThemedText>
            ) : (
              years.map((year, index) => (
                <View key={year}>
                  {index > 0 && <YearDivider year={year} />}
                  {byYear[year].map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      dateText={formatBookingDate(booking)}
                      reviewRating={bookingReviewMap[booking.id]}
                      onOpenReview={() => {
                        const imageParam = booking.item?.imageUrl
                          ? `&entityImage=${encodeURIComponent(booking.item.imageUrl)}`
                          : '';
                        router.push(
                          `/screens/review?entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=${encodeURIComponent(booking.item?.name ?? 'Booking')}${imageParam}`
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
  <View className="w-full mb-4 items-center justify-center">
    <View className="w-px h-4 bg-gray-300 dark:bg-gray-800" />
    <ThemedText className="text-base text-gray-500 my-1">{props.year}</ThemedText>
    <View className="w-px h-4 bg-gray-300 dark:bg-gray-800" />
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
  const { booking, dateText, reviewRating, onOpenReview } = props;
  const imageSource = booking.item?.imageUrl
    ? { uri: booking.item.imageUrl }
    : require('@/assets/img/room-1.avif');
  const title = booking.item?.name ?? 'Booking';
  const isPast = isPastAndNotCancelled(booking);
  const hasReview = reviewRating != null && reviewRating >= 1;

  return (
    <View
      style={shadowPresets.large}
      className="w-full p-2 mb-4 flex flex-row items-center rounded-2xl bg-light-primary dark:bg-dark-secondary"
    >
      <Link asChild href={`/screens/trip-detail?id=${booking.id}`}>
        <TouchableOpacity className="flex-1 flex-row items-center" activeOpacity={0.8}>
          <Image source={imageSource} className="w-20 h-20 rounded-xl" resizeMode="cover" />
          <View className="px-4 flex-1">
            <ThemedText className="text-base font-bold">{title}</ThemedText>
            <ThemedText className="text-xs text-gray-500">{dateText}</ThemedText>
            {booking.branch?.name ? (
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">{booking.branch.name}</ThemedText>
            ) : null}
          </View>
        </TouchableOpacity>
      </Link>
      {isPast ? (
        <View className="pr-2">
          {hasReview ? (
            <TouchableOpacity onPress={onOpenReview} activeOpacity={0.7}>
              <ShowRating rating={reviewRating!} size="sm" displayMode="stars" />
            </TouchableOpacity>
          ) : (
            <Chip
              label="Add review"
              size="sm"
              rounded="xl"
              icon="Star"
              onPress={onOpenReview}
              className="bg-light-secondary dark:bg-dark-secondary"
            />
          )}
        </View>
      ) : (
        <View className="pr-2">
          <CountdownDisplay target={getTargetDate(booking)} />
        </View>
      )}
    </View>
  );
};

export default TripsScreen; 