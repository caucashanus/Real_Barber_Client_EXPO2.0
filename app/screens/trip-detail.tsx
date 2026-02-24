import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedFooter from '@/components/ThemeFooter';
import Section from '@/components/layout/Section';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedText from '@/components/ThemedText';
import Avatar from '@/components/Avatar';
import ListLink from '@/components/ListLink';
import Divider from '@/components/layout/Divider';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBookings, type Booking } from '../../api/bookings';

const BRANCH_IMAGES: Record<string, number> = {
  'Modřany': require('@/assets/img/branches/Modrany.jpg'),
  'Kačerov': require('@/assets/img/branches/Kačerov.jpg'),
  'Hagibor': require('@/assets/img/branches/Hagibor.jpg'),
  'Barrandov': require('@/assets/img/branches/Barrandov.jpg'),
};

const PLACEHOLDER_IMAGES = ['https://tinyurl.com/2yyfr9rc', 'https://tinyurl.com/2cmu4ns5'];

function getBookingCarouselImages(branchName: string | undefined): (string | number)[] {
  const first = branchName && BRANCH_IMAGES[branchName] != null
    ? BRANCH_IMAGES[branchName]
    : require('@/assets/img/branches/Modrany.jpg');
  return [first, ...PLACEHOLDER_IMAGES];
}

function formatAppointment(b: Booking): { dateStr: string; fromTime: string; toTime: string } {
  const d = new Date(b.date);
  const dateStr = `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
  return {
    dateStr,
    fromTime: b.slotStart,
    toTime: b.slotEnd,
  };
}

const BookingDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBookings(apiToken, { limit: 50 })
      .then((res) => {
        const found = res.bookings.find((b) => b.id === id) ?? null;
        setBooking(found);
        if (!found) setError('Booking not found');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  if (loading) {
    return (
      <>
        <Header title="Booking Detail" showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
        </View>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header title="Booking Detail" showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error ?? 'Booking not found'}</ThemedText>
        </View>
      </>
    );
  }

  const appointment = formatAppointment(booking);
  const location = booking.branch?.address ?? booking.branch?.name ?? '—';
  const carouselImages = getBookingCarouselImages(booking.branch?.name);

  return (
    <>
      <Header title="Booking Detail" showBackButton />
      <ThemedScroller className="flex-1 px-0" keyboardShouldPersistTaps="handled">
        <AnimatedView animation="fadeIn" duration={400} delay={100}>
          <View className="px-global">
            <ImageCarousel
              height={300}
              rounded="2xl"
              images={carouselImages}
            />
          </View>

          <View className="px-global pt-6 pb-4">
            <ThemedText className="text-2xl font-bold mb-2">{booking.branch?.name ?? '—'}</ThemedText>
            <View className="flex-row items-center">
              <Icon name="MapPin" size={16} className="mr-2 text-light-subtext dark:text-dark-subtext" />
              <ThemedText className="text-light-subtext dark:text-dark-subtext">{location}</ThemedText>
            </View>
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title="In care of" titleSize="lg" className="px-global pt-4">
            <View className="flex-row items-center justify-between mt-4 mb-4">
              <View className="flex-row items-center flex-1">
                <Avatar src={booking.employee?.avatarUrl ?? undefined} name={booking.employee?.name} size="lg" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-lg font-semibold">{booking.employee?.name ?? '—'}</ThemedText>
                  {booking.item?.name ? (
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                      {booking.item.name}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </View>
            <ListLink
              icon="MessageCircle"
              title="Message"
              description="Get help with your booking"
              href="/screens/chat/user"
              showChevron
              className="px-4 py-3 bg-light-secondary dark:bg-dark-secondary rounded-xl"
            />
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title="Your appointment" titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-4">
              <ThemedText className="text-lg font-semibold">{appointment.dateStr}</ThemedText>
              <View className="flex-row items-center justify-between bg-light-secondary dark:bg-dark-secondary rounded-xl p-4">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">From</ThemedText>
                  <ThemedText className="text-lg font-semibold">{appointment.fromTime}</ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">To</ThemedText>
                  <ThemedText className="text-lg font-semibold">{appointment.toTime}</ThemedText>
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-2">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">Duration</ThemedText>
                  <ThemedText className="text-lg font-semibold">{booking.duration} min</ThemedText>
                </View>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title="Reservation details" titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Reservation number</ThemedText>
                <ThemedText className="font-medium">#{booking.id.slice(0, 8)}</ThemedText>
              </View>
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Status</ThemedText>
                <ThemedText className="font-medium capitalize">{booking.status}</ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title="Price details" titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">{booking.item?.name ?? 'Service'}</ThemedText>
                <ThemedText>{booking.price} Kč</ThemedText>
              </View>
              <Divider className="my-3" />
              <View className="flex-row justify-between">
                <ThemedText className="font-bold text-lg">Total</ThemedText>
                <ThemedText className="font-bold text-lg">{booking.price} Kč</ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          {booking.paymentMethod ? (
            <>
              <Section title="Payment information" titleSize="lg" className="px-global pt-4">
                <View className="flex-row items-center mt-4">
                  <Icon name="CreditCard" size={20} className="mr-3" />
                  <View>
                    <ThemedText className="font-medium capitalize">{booking.paymentMethod.replace(/_/g, ' ')}</ThemedText>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {booking.price} Kč
                    </ThemedText>
                  </View>
                </View>
              </Section>
              <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />
            </>
          ) : null}

          <Section title="Location" titleSize="lg" className="px-global pt-4 pb-6">
            <View className="mt-4">
              <ThemedText className="text-light-subtext dark:text-dark-subtext mb-4">{location}</ThemedText>
              {booking.branch?.phone ? (
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{booking.branch.phone}</ThemedText>
              ) : null}
              <View className="w-full h-48 bg-light-secondary dark:bg-dark-secondary rounded-xl items-center justify-center mt-4">
                <Icon name="Map" size={48} className="text-light-subtext dark:text-dark-subtext mb-2" />
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Map</ThemedText>
              </View>
            </View>
          </Section>
        </AnimatedView>
      </ThemedScroller>

      <ThemedFooter>
        <View className="flex-row space-x-3">
          <Button
            title="Review"
            variant="outline"
            iconStart="Star"
            className="flex-1"
            href="/screens/review"
          />
          <Button
            title="Cancel booking"
            variant="outline"
            iconStart="X"
            className="flex-1"
            onPress={() => {}}
          />
        </View>
      </ThemedFooter>
    </>
  );
};

export default BookingDetailScreen;
