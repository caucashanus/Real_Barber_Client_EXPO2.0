import React from 'react';
import { View } from 'react-native';

import type { Booking } from '@/api/bookings';
import AppButton from '@/components/AppButton';
import ListLink from '@/components/ListLink';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BookingDetailAppointmentSectionProps {
  appointment: { dateStr: string; fromTime: string; toTime: string };
  booking: Booking;
  canAddToCalendar: boolean;
  canShare: boolean;
  onAddToCalendar: () => void;
  onShare: () => void;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailAppointmentSection({
  appointment,
  booking,
  canAddToCalendar,
  canShare,
  onAddToCalendar,
  onShare,
  t,
}: BookingDetailAppointmentSectionProps) {
  return (
    <Section
      title={t('bookingYourAppointment')}
      titleSize="lg"
      titleTrailingAlign="end"
      titleTrailing={
        canShare ? (
          <AppButton
            title={t('bookingShareDetailButton')}
            variant="outline"
            size="sm"
            rounded="full"
            className="px-2.5 py-1"
            iconStart="Share"
            iconSize={13}
            textClassName="text-xs font-semibold leading-tight"
            onPress={onShare}
          />
        ) : null
      }
      className="mt-6 px-global pt-4">
      <View className="mt-4 space-y-4">
        <ThemedText className="text-lg font-semibold">{appointment.dateStr}</ThemedText>
        <View className="flex-row items-center justify-between rounded-xl bg-light-surface p-4 dark:bg-dark-secondary">
          <View>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('bookingFrom')}
            </ThemedText>
            <ThemedText className="text-lg font-semibold">{appointment.fromTime}</ThemedText>
          </View>
          <View className="items-end">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('bookingTo')}
            </ThemedText>
            <ThemedText className="text-lg font-semibold">{appointment.toTime}</ThemedText>
          </View>
        </View>
        {canAddToCalendar ? (
          <ListLink
            icon="CalendarPlus"
            title={t('bookingAddToCalendar')}
            description={t('bookingAddToCalendarDescription')}
            showChevron
            className="rounded-xl bg-light-surface px-4 py-3 dark:bg-dark-secondary"
            onPress={onAddToCalendar}
          />
        ) : null}
        <View className="flex-row items-center justify-between pt-2">
          <View>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('bookingDuration')}
            </ThemedText>
            <ThemedText className="text-lg font-semibold">
              {booking.duration} {t('bookingMinutesShort')}
            </ThemedText>
          </View>
        </View>
      </View>
    </Section>
  );
}
