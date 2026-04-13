import React, { useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import ShowRating from '@/components/ShowRating';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import ListLink from '@/components/ListLink';

// Sample booking request data from host's perspective
const bookingData = {
  id: '1',
  propertyName: 'Luxury Beachfront Villa',
  location: 'Barcelona, Spain',
  guest: {
    name: 'John Smith',
    avatar: require('@/assets/img/wallet/RB.avatar.jpg'),
    rating: 4.7,
    reviewCount: 23,
    joinedDate: 'Joined in 2022',
    verifications: ['Email', 'Phone', 'Government ID'],
  },
  checkIn: 'Dec 20, 2025',
  checkOut: 'Dec 25, 2025',
  nights: 5,
  guests: 4,
  adults: 3,
  children: 1,
  infants: 0,
  pets: 0,
  requestDate: 'Dec 10, 2024',
  totalPrice: '$1,750',
  guestMessage:
    "Hi! We're a family of 4 looking forward to staying at your beautiful villa. We're celebrating our anniversary and would love to experience the local culture. We're respectful guests and will take great care of your property.",
  specialRequests: [
    'Early check-in if possible (around 1 PM)',
    'Recommendations for family-friendly restaurants',
    'Information about nearby beaches',
  ],
  status: 'pending', // pending, approved, rejected
};

const BookingDetailScreen = () => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const heroScrollY = useRef(new Animated.Value(0)).current;

  const handleApprove = () => {
    console.log('Booking approved');
    // Handle approval logic
  };

  const handleReject = () => {
    console.log('Booking rejected');
    // Handle rejection logic
  };

  return (
    <>
      <Header title={t('bookingDetailTitle')} showBackButton />
      <ThemedScroller
        className="flex-1 px-0"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="fadeIn" duration={400} delay={100}>
          {/* Property Images */}
          <View className="px-global">
            <ImageCarousel
              height={300}
              rounded="2xl"
              images={[
                'https://tinyurl.com/2blrf2sk',
                'https://tinyurl.com/2yyfr9rc',
                'https://tinyurl.com/2cmu4ns5',
              ]}
              scrollY={heroScrollY}
              stretchOnPullDown
            />
          </View>

          {/* Property Name and Location */}
          <View className="px-global pb-4 pt-6">
            <ThemedText className="mb-2 text-2xl font-bold">{bookingData.propertyName}</ThemedText>
            <View className="flex-row items-center">
              <Icon
                name="MapPin"
                size={16}
                className="mr-2 text-light-subtext dark:text-dark-subtext"
              />
              <ThemedText className="text-light-subtext dark:text-dark-subtext">
                {bookingData.location}
              </ThemedText>
            </View>
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          {/* Guest Information */}
          <Section title={t('bookingGuestInfo')} titleSize="lg" className="px-global pt-4">
            <View className="mb-4 mt-4 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <Avatar src={bookingData.guest.avatar} size="lg" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-lg font-semibold">
                    {bookingData.guest.name}
                  </ThemedText>
                  <View className="mt-px flex-row items-center">
                    <ShowRating rating={bookingData.guest.rating} size="sm" />
                    <ThemedText className="ml-2 text-sm text-light-subtext dark:text-dark-subtext">
                      ({bookingData.guest.reviewCount} reviews)
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <ListLink
              icon="MessageCircle"
              title={t('bookingMessageGuest')}
              description="Communicate with your guest"
              href="/screens/chat/user"
              showChevron
              className="rounded-xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary"
            />
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          {/* Booking Details */}
          <Section title={t('bookingDetails')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 space-y-4">
              <View className="flex-row items-center justify-between rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    Check-in
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">{bookingData.checkIn}</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    After 3:00 PM
                  </ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    Check-out
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">{bookingData.checkOut}</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    Before 11:00 AM
                  </ThemedText>
                </View>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    Duration
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">
                    {bookingData.nights} nights
                  </ThemedText>
                </View>
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    Total guests
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">
                    {bookingData.guests} guests
                  </ThemedText>
                </View>
              </View>

              <View className="rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
                <ThemedText className="mb-3 font-medium">Guest breakdown</ThemedText>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <ThemedText className="text-light-subtext dark:text-dark-subtext">
                      Adults
                    </ThemedText>
                    <ThemedText>{bookingData.adults}</ThemedText>
                  </View>
                  <View className="flex-row justify-between">
                    <ThemedText className="text-light-subtext dark:text-dark-subtext">
                      Children
                    </ThemedText>
                    <ThemedText>{bookingData.children}</ThemedText>
                  </View>
                  <View className="flex-row justify-between">
                    <ThemedText className="text-light-subtext dark:text-dark-subtext">
                      Infants
                    </ThemedText>
                    <ThemedText>{bookingData.infants}</ThemedText>
                  </View>
                  <View className="flex-row justify-between">
                    <ThemedText className="text-light-subtext dark:text-dark-subtext">
                      Pets
                    </ThemedText>
                    <ThemedText>{bookingData.pets}</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          {/* Guest Message */}
          <Section title={t('bookingMessageFromGuest')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
              <ThemedText className="text-sm leading-6">{bookingData.guestMessage}</ThemedText>
            </View>

            {bookingData.specialRequests.length > 0 && (
              <View className="mt-4">
                <ThemedText className="mb-3 font-medium">Special requests</ThemedText>
                {bookingData.specialRequests.map((request, index) => (
                  <View key={index} className="mb-2 flex-row items-start">
                    <Icon
                      name="Circle"
                      size={6}
                      className="mr-3 mt-2 text-light-subtext dark:text-dark-subtext"
                    />
                    <ThemedText className="flex-1 text-sm text-light-subtext dark:text-dark-subtext">
                      {request}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          {/* Request Details */}
          <Section
            title={t('bookingRequestDetails')}
            titleSize="lg"
            titleAlign="right"
            className="px-global pb-6 pt-4">
            <View className="mt-4 space-y-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">
                  Request date
                </ThemedText>
                <ThemedText className="font-medium">{bookingData.requestDate}</ThemedText>
              </View>

              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">
                  Status
                </ThemedText>
                <View className="rounded-full bg-yellow-100 px-3 py-1 dark:bg-yellow-900">
                  <ThemedText className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                    Pending Review
                  </ThemedText>
                </View>
              </View>

              <View className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <View className="flex-row items-start">
                  <Icon
                    name="Info"
                    size={16}
                    className="mr-3 mt-1 text-blue-600 dark:text-blue-400"
                  />
                  <View className="flex-1">
                    <ThemedText className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Response required
                    </ThemedText>
                    <ThemedText className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                      Please respond within 24 hours to maintain your response rate
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </Section>
        </AnimatedView>
      </ThemedScroller>

      <ThemedFooter>
        <View className="flex-row space-x-3">
          <Button
            title={t('bookingReject')}
            variant="outline"
            iconStart="X"
            className="flex-1"
            onPress={handleReject}
          />
          <Button
            title={t('bookingApprove')}
            variant="primary"
            textClassName="text-white"
            iconStart="Check"
            className="flex-1"
            iconColor="white"
            onPress={handleApprove}
          />
        </View>
      </ThemedFooter>
    </>
  );
};

export default BookingDetailScreen;
