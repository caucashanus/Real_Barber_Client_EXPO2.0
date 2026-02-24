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

function formatBookingDate(b: Booking): string {
  const d = new Date(b.date);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}, ${b.slotStart} - ${b.slotEnd}`;
}

function groupBookingsByYear(bookings: Booking[]): Record<string, Booking[]> {
  const byYear: Record<string, Booking[]> = {};
  const sorted = [...bookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const b of sorted) {
    const year = String(new Date(b.date).getFullYear());
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(b);
  }
  return byYear;
}

const TripsScreen = () => {
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBookings(apiToken, { limit: 50, upcoming: false })
      .then((res) => setBookings(res.bookings))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const byYear = groupBookingsByYear(bookings);
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