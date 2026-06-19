import React from 'react';
import { View } from 'react-native';

import type { Booking } from '@/api/bookings';
import ListLink from '@/components/ListLink';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BookingDetailAppointmentSectionProps {
  appointment: { dateStr: string; fromTime: string; toTime: string };
  booking: Booking;
  canAddToCalendar: boolean;
  onAddToCalendar: () => void;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailAppointmentSection({
  appointment,
  booking,
  canAddToCalendar,
  onAddToCalendar,
  t,
}: BookingDetailAppointmentSectionProps) {
  return (
    <>
      <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('bookingYourAppointment')} titleSize="lg" className="px-global pt-4">
        <View className="mt-4 space-y-4">
          <ThemedText variant="h4">{appointment.dateStr}</ThemedText>
          <View className="flex-row items-center justify-between rounded-xl bg-light-secondary p-card dark:bg-dark-secondary">
            <View>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('bookingFrom')}
              </ThemedText>
              <ThemedText variant="h4">{appointment.fromTime}</ThemedText>
            </View>
            <View className="items-end">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('bookingTo')}
              </ThemedText>
              <ThemedText variant="h4">{appointment.toTime}</ThemedText>
            </View>
          </View>
          {canAddToCalendar ? (
            <ListLink
              icon="CalendarPlus"
              title={t('bookingAddToCalendar')}
              description={t('bookingAddToCalendarDescription')}
              showChevron
              className="rounded-xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary"
              onPress={onAddToCalendar}
            />
          ) : null}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('bookingDuration')}
              </ThemedText>
              <ThemedText variant="h4">
                {booking.duration} {t('bookingMinutesShort')}
              </ThemedText>
            </View>
          </View>
        </View>
      </Section>
    </>
  );
}
