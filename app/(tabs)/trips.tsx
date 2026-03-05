import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { Link } from 'expo-router';
import { shadowPresets } from '@/utils/useShadow';
import ThemeScroller from '@/components/ThemeScroller';
import AnimatedView from '@/components/AnimatedView';
import Header from '@/components/Header';
import { useCollapsibleTitle } from '@/app/hooks/useCollapsibleTitle';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBookings, type Booking } from '@/api/bookings';
import { Chip } from '@/components/Chip';
import { CardScroller } from '@/components/CardScroller';

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

const todayStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function countByFilter(bookings: Booking[]): { upcoming: number; past: number; cancelled: number; rated: number; pendingReview: number } {
  const now = todayStart().getTime();
  let upcoming = 0;
  let past = 0;
  let cancelled = 0;
  let rated = 0;
  let pendingReview = 0;
  for (const b of bookings) {
    const status = (b.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') {
      cancelled += 1;
    } else if (new Date(b.date).getTime() >= now) {
      upcoming += 1;
    } else {
      past += 1;
      // TODO: when API provides "hasReview" or review id, use it for rated vs pendingReview
      pendingReview += 1;
    }
  }
  return { upcoming, past, cancelled, rated, pendingReview };
}

const TripsScreen = () => {
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>('all');

  const counts = countByFilter(bookings);

  const filteredBookings =
    selectedFilter === 'all'
      ? bookings
      : selectedFilter === 'upcoming'
        ? bookings.filter((b) => {
            const status = (b.status ?? '').toLowerCase();
            if (status === 'cancelled' || status === 'canceled') return false;
            return new Date(b.date).getTime() >= todayStart().getTime();
          })
        : selectedFilter === 'past'
          ? bookings.filter((b) => {
              const status = (b.status ?? '').toLowerCase();
              if (status === 'cancelled' || status === 'canceled') return false;
              return new Date(b.date).getTime() < todayStart().getTime();
            })
          : selectedFilter === 'cancelled'
            ? bookings.filter((b) => {
                const status = (b.status ?? '').toLowerCase();
                return status === 'cancelled' || status === 'canceled';
              })
            : selectedFilter === 'rated'
              ? bookings.filter((b) => {
                  const status = (b.status ?? '').toLowerCase();
                  if (status === 'cancelled' || status === 'canceled') return false;
                  if (new Date(b.date).getTime() >= todayStart().getTime()) return false;
                  // TODO: when API has review flag, filter (b as Booking & { hasReview?: boolean }).hasReview
                  return false;
                })
              : selectedFilter === 'pending_review'
                ? bookings.filter((b) => {
                    const status = (b.status ?? '').toLowerCase();
                    if (status === 'cancelled' || status === 'canceled') return false;
                    return new Date(b.date).getTime() < todayStart().getTime();
                  })
                : bookings;

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBookings(apiToken)
      .then((res) => setBookings(res.bookings))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

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
                label={`Ohodnoceno (${counts.rated})`}
                selectable
                isSelected={selectedFilter === 'rated'}
                onPress={() => setSelectedFilter('rated')}
              />
              <Chip
                size="lg"
                label={`Čeká na hodnocení (${counts.pendingReview})`}
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

const BookingCard = (props: { booking: Booking; dateText: string }) => {
  const { booking, dateText } = props;
  const imageSource = booking.item?.imageUrl
    ? { uri: booking.item.imageUrl }
    : require('@/assets/img/room-1.avif');
  const title = booking.item?.name ?? 'Booking';

  return (
    <View className="relative">
      <Link asChild href={`/screens/trip-detail?id=${booking.id}`}>
        <TouchableOpacity
          style={shadowPresets.large}
          activeOpacity={0.8}
          className="w-full p-2 mb-4 flex flex-row items-center rounded-2xl bg-light-primary dark:bg-dark-secondary"
        >
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
    </View>
  );
};

export default TripsScreen; 