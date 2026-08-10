import React from 'react';
import { Linking, Pressable, View } from 'react-native';

import type { Booking } from '@/api/bookings';
import AppButton from '@/components/AppButton';
import BranchAddress from '@/components/shared/BranchAddress';
import ThemedText from '@/components/ThemedText';
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
    <Section
      title={t('bookingDetailLocation')}
      titleSize="lg"
      className="mt-6 px-global pb-6 pt-4"
      header={
        <View className="w-full flex-row items-center justify-between">
          <ThemedText className="text-lg font-semibold">{t('bookingDetailLocation')}</ThemedText>
          <AppButton
            title={t('bookingDetailFullMap')}
            variant="outline"
            size="sm"
            rounded="full"
            className="px-2.5 py-1"
            iconStart="Map"
            iconSize={13}
            textClassName="text-xs font-semibold leading-tight"
            href="/screens/map"
          />
        </View>
      }>
      <View className="mt-4">
        <BranchAddress address={location === '—' ? null : location} className="mb-4" />
        {booking.branch?.phone ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${booking.branch!.phone!.replace(/\s/g, '')}`)}>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {booking.branch.phone}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </Section>
  );
}
