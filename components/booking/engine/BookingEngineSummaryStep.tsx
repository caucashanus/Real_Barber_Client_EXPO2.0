import React from 'react';
import { View } from 'react-native';

import { formatResolvedBookingPriceLabel } from '@/lib/booking/designShared';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import BookingCouponSection from '@/components/booking/engine/BookingCouponSection';
import BookingHoldSummaryRow, {
  shouldShowBookingHoldSummaryRow,
} from '@/components/booking/engine/BookingHoldSummaryRow';
import BookingSummaryBranchSection from '@/components/booking/engine/BookingSummaryBranchSection';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { formatBookingSummaryDatetimeLabel } from '@/utils/reservationCreateHelpers';

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingEngineSummaryStep({ flow }: Props) {
  const { t, coupon } = flow;

  if (!flow.selectedSlot) {
    return (
      <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
        {t('bookingSummaryMissingSlot')}
      </ThemedText>
    );
  }

  const employee = flow.selectedEmployee ?? flow.profileEmployee ?? null;
  const employeeName = employee?.displayName ?? employee?.name ?? '—';
  const dateLabel = formatBookingSummaryDatetimeLabel({
    dateIso: flow.selectedDate,
    slotStart: flow.selectedSlot?.start,
    slotEnd: flow.selectedSlot?.end,
    todayIso: flow.todayIso,
    dateLocaleTag: flow.dateLocaleTag,
  });

  const rows: Array<{ titleKey: TranslationKey; label: string }> = [
    { titleKey: 'bookingProgressDatetime', label: dateLabel },
    { titleKey: 'bookingProgressService', label: flow.selectedService?.name ?? '—' },
    { titleKey: 'haircutBarber', label: employeeName },
  ];

  const priceLabel =
    !coupon.preview
      ? formatResolvedBookingPriceLabel(
          flow.resolvedBookingPrice,
          t('reservationPriceFromPrefix'),
          t('reservationCurrencySuffix')
        )
      : undefined;

  if (priceLabel) {
    rows.push({
      titleKey: 'bookingSummaryPrice',
      label: priceLabel,
    });
  }

  return (
    <View className="gap-5">
      <Section title={t('reservationSummaryTitle')} titleSize="lg" className="mt-6">
        <View className="mt-2">
          <BookingHoldSummaryRow flow={flow} plain />
          {rows.slice(0, 1).map((row, index) => (
            <View
              key={row.titleKey}
              className={
                index > 0 || shouldShowBookingHoldSummaryRow(flow) ? 'mt-4' : undefined
              }>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t(row.titleKey)}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">{row.label}</ThemedText>
            </View>
          ))}
          <BookingSummaryBranchSection
            branchName={flow.selectedBranch?.name ?? '—'}
            branchAddress={flow.selectedBranch?.address}
            topClassName="mt-4"
          />
          {rows.slice(1).map((row) => (
            <View key={row.titleKey} className="mt-4">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t(row.titleKey)}
              </ThemedText>
              <ThemedText className="mt-1 text-sm font-semibold">{row.label}</ThemedText>
            </View>
          ))}

          <BookingCouponSection flow={flow} coupon={coupon} plain />
        </View>
      </Section>

      {flow.contact.submitError ? (
        <ThemedText className="text-sm text-red-500 dark:text-red-400">
          {flow.contact.submitError}
        </ThemedText>
      ) : null}
    </View>
  );
}
