import React from 'react';
import { View } from 'react-native';

import BookingHoldSummaryRow, {
  shouldShowBookingHoldSummaryRow,
} from '@/components/booking/engine/BookingHoldSummaryRow';
import BookingSummaryBranchSection from '@/components/booking/engine/BookingSummaryBranchSection';
import { formatResolvedBookingPriceLabel } from '@/lib/booking/designShared';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { formatBookingSummaryDatetimeLabel } from '@/utils/reservationCreateHelpers';

interface Props {
  flow: BookingEngineFlow;
  hideCatalogPrice?: boolean;
  plain?: boolean;
}

type SummaryRow = {
  icon: React.ComponentProps<typeof Icon>['name'];
  titleKey:
    | 'bookingProgressDatetime'
    | 'bookingProgressService'
    | 'haircutBarber'
    | 'bookingSummaryPrice';
  label: string;
};

export default function BookingContactSummaryPanel({
  flow,
  hideCatalogPrice = false,
  plain = false,
}: Props) {
  const { t } = flow;
  const datetimeLabel = formatBookingSummaryDatetimeLabel({
    dateIso: flow.selectedDate,
    slotStart: flow.selectedSlot?.start,
    slotEnd: flow.selectedSlot?.end,
    todayIso: flow.todayIso,
    dateLocaleTag: flow.dateLocaleTag,
  });

  const employeeName =
    flow.selectedEmployee?.displayName ??
    flow.selectedEmployee?.name ??
    flow.profileEmployee?.name ??
    '—';

  const branchName = flow.selectedBranch?.name ?? '—';
  const branchAddress = flow.selectedBranch?.address;

  const priceLabel =
    !hideCatalogPrice
      ? formatResolvedBookingPriceLabel(
          flow.resolvedBookingPrice,
          t('reservationPriceFromPrefix'),
          t('reservationCurrencySuffix')
        )
      : undefined;

  const rows: SummaryRow[] = [
    {
      icon: 'Calendar',
      titleKey: 'bookingProgressDatetime',
      label: datetimeLabel,
    },
    {
      icon: 'Scissors',
      titleKey: 'bookingProgressService',
      label: flow.selectedService?.name ?? '—',
    },
    {
      icon: 'User',
      titleKey: 'haircutBarber',
      label: employeeName,
    },
    ...(priceLabel
      ? [
          {
            icon: 'CreditCard' as const,
            titleKey: 'bookingSummaryPrice' as const,
            label: priceLabel,
          },
        ]
      : []),
  ];

  const renderRow = (row: SummaryRow, index: number, hasHoldAbove = false) => {
    const topClass =
      index > 0 || hasHoldAbove ? (plain ? 'mt-4' : 'mt-3') : undefined;

    return plain ? (
      <View key={row.titleKey} className={topClass}>
        <ThemedText className="text-sm font-semibold">{t(row.titleKey)}</ThemedText>
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {row.label}
        </ThemedText>
      </View>
    ) : (
      <View key={row.titleKey} className={`flex-row items-start gap-3 ${topClass ?? ''}`}>
        <Icon name={row.icon} size={16} className="mt-0.5 text-light-subtext dark:text-dark-subtext" />
        <ThemedText className="flex-1 text-sm">{row.label}</ThemedText>
      </View>
    );
  };

  const holdVisible = shouldShowBookingHoldSummaryRow(flow);

  return (
    <View className={plain ? undefined : 'rounded-2xl border border-light-secondary bg-light-surface p-4 dark:border-dark-secondary dark:bg-dark-secondary'}>
      <BookingHoldSummaryRow flow={flow} plain={plain} />
      {renderRow(rows[0], 0, holdVisible)}
      <BookingSummaryBranchSection
        branchName={branchName}
        branchAddress={branchAddress}
        topClassName={plain ? 'mt-4' : 'mt-3'}
        valueClassName={plain ? 'mt-1 text-sm font-semibold' : 'mt-1 text-sm font-semibold'}
      />
      {rows.slice(1).map((row, index) => renderRow(row, index + 1))}
    </View>
  );
}
