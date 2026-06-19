import React from 'react';
import { Linking, Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BookingDetailLocationSectionProps {
  booking: Booking;
  location: string;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailLocationSection({
  booking,
  location,
  t,
}: BookingDetailLocationSectionProps) {
  return (
    <>
      <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section
        title={t('bookingDetailLocation')}
        titleSize="lg"
        className="px-global pb-6 pt-4"
        header={
          <View className="w-full flex-row items-center justify-between">
            <ThemedText variant="h4">{t('bookingDetailLocation')}</ThemedText>
            <Button
              title={t('bookingDetailFullMap')}
              iconStart="Map"
              variant="secondary"
              size="small"
              rounded="full"
              href="/screens/map"
              className="bg-light-secondary dark:bg-dark-secondary"
            />
          </View>
        }>
        <View className="mt-4">
          <Pressable
            onPress={() => {
              if (location && location !== '—') {
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
                );
              }
            }}
            className="mb-4">
            <ThemedText className="text-light-subtext underline dark:text-dark-subtext">
              {location}
            </ThemedText>
          </Pressable>
          {booking.branch?.phone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${booking.branch!.phone!.replace(/\s/g, '')}`)}>
              <ThemedText className="text-sm text-light-subtext underline dark:text-dark-subtext">
                {booking.branch.phone}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </Section>
    </>
  );
}
