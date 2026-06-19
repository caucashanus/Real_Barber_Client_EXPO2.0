import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import type { Booking } from '@/api/bookings';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { getBookingUiStatusTranslationKey } from '@/utils/bookingHelpers';

interface BookingDetailReservationInfoSectionProps {
  booking: Booking;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailReservationInfoSection({
  booking,
  t,
}: BookingDetailReservationInfoSectionProps) {
  return (
    <>
      <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('bookingReservationDetails')} titleSize="lg" className="px-global pt-4">
        <View className="mt-4 space-y-3">
          <Image
            source={
              booking.item?.imageUrl
                ? { uri: booking.item.imageUrl }
                : require('@/assets/img/barbers.png')
            }
            className="mb-3 h-32 w-32 rounded-xl"
            contentFit="cover"
          />
          <View className="flex-row justify-between">
            <ThemedText className="text-light-subtext dark:text-dark-subtext">
              {t('bookingReservationNumber')}
            </ThemedText>
            <ThemedText variant="body">#{booking.id.slice(0, 8)}</ThemedText>
          </View>
          <View className="flex-row justify-between">
            <ThemedText className="text-light-subtext dark:text-dark-subtext">
              {t('bookingStatus')}
            </ThemedText>
            <ThemedText variant="body">
              {t(getBookingUiStatusTranslationKey(booking))}
            </ThemedText>
          </View>
        </View>
      </Section>
    </>
  );
}
