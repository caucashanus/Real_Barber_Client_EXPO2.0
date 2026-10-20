import React, { useMemo } from 'react';

import type { Booking } from '@/api/bookings';
import BookingCardStatusPillRow from '@/components/booking/BookingCardStatusPillRow';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import ThemedText from '@/components/ThemedText';
import { useLanguage } from '@/contexts/LanguageContext';
import { intlLocaleTag } from '@/utils/intlLocaleTag';

type Props = {
  booking: Booking;
  onPress: () => void;
  isFirst?: boolean;
};

function formatAccountStyleBookingDate(booking: Booking, locale: string): string {
  const d = new Date(booking.date);
  const dateLocale = intlLocaleTag(locale);
  if (Number.isNaN(d.getTime())) {
    return `${(booking.date || '').slice(0, 10)}, ${booking.slotStart}`;
  }
  const day = d.getDate();
  const month = d.toLocaleString(dateLocale, { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}, ${booking.slotStart}`;
}

/** Stejná karta jako výběr / seznam rezervací (`BookingPanelPickerRow` ≈ `BookingCard`). */
export default function KidsWatchPickBookingRow({ booking, onPress, isFirst = false }: Props) {
  const { locale } = useLanguage();
  const title = booking.item?.name?.trim() || '—';
  const dateText = useMemo(
    () => formatAccountStyleBookingDate(booking, locale),
    [booking, locale]
  );
  const branchName = booking.branch?.name?.trim();

  return (
    <BookingPanelPickerRow
      leadingClassName={isFirst ? 'mt-0' : 'mt-3'}
      headerInsetClassName="pt-2"
      header={<BookingCardStatusPillRow booking={booking} className="mb-0.5" />}
      imageUrl={booking.employee?.avatarUrl}
      fallbackName={booking.employee?.name ?? title}
      avatarSize="md"
      imageShape="round"
      title={title}
      description={dateText}
      meta={
        branchName ? (
          <ThemedText
            className="text-xs text-light-subtext dark:text-dark-subtext"
            numberOfLines={1}>
            {branchName}
          </ThemedText>
        ) : undefined
      }
      onPress={onPress}
    />
  );
}
