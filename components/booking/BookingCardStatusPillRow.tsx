import React from 'react';
import { View } from 'react-native';

import type { Booking } from '@/api/bookings';
import BookingCountdownPill from '@/components/booking/BookingCountdownPill';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getBookingStartDate,
  getBookingUiStatusTranslationKey,
  isBookingCurrent,
  isBookingUpcoming,
} from '@/utils/bookingHelpers';

type Props = {
  booking: Booking;
  className?: string;
};

/** Horní řádek karet v Rezervace — stav vlevo, odpočet vpravo. */
export default function BookingCardStatusPillRow({ booking, className = '' }: Props) {
  const { t } = useTranslation();
  const isCurrent = isBookingCurrent(booking);
  const isUpcoming = isBookingUpcoming(booking);
  const statusLabel = t(getBookingUiStatusTranslationKey(booking));

  const status = (booking.status ?? '').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'canceled';

  let statusPillClass = 'bg-neutral-100 dark:bg-neutral-800';
  let statusTextClass = 'text-neutral-700 dark:text-neutral-300';
  if (isCancelled) {
    statusPillClass = 'bg-red-100 dark:bg-red-900/30';
    statusTextClass = 'text-red-700 dark:text-red-300';
  } else if (isCurrent) {
    statusPillClass = 'bg-green-100 dark:bg-green-900/30';
    statusTextClass = 'text-green-700 dark:text-green-300';
  }

  return (
    <View className={`flex-row items-center justify-between gap-3 ${className}`}>
      <View className="flex-row items-center">
        <View className={`rounded-full px-2.5 py-1 ${statusPillClass}`}>
          <ThemedText className={`text-xs font-semibold ${statusTextClass}`}>{statusLabel}</ThemedText>
        </View>
        {isCurrent ? (
          <View className="ml-2">
            <LiveIndicator />
          </View>
        ) : null}
      </View>
      {isUpcoming ? <BookingCountdownPill target={getBookingStartDate(booking)} /> : null}
    </View>
  );
}
