import React from 'react';
import { View } from 'react-native';

import { formatResolvedBookingPriceLabel } from '@/lib/booking/designShared';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import Icon from '@/components/Icon';
import BranchAddress from '@/components/shared/BranchAddress';
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

  const branchBlock = plain ? (
    <View>
      <ThemedText className="text-sm font-semibold">{t('bookingProgressBranch')}</ThemedText>
      <ThemedText className="mt-1 text-sm">{branchName}</ThemedText>
      <BranchAddress address={branchAddress} className="mt-1" />
    </View>
  ) : (
    <View className="flex-row items-start gap-3">
      <Icon name="MapPin" size={16} className="mt-0.5 text-light-subtext dark:text-dark-subtext" />
      <View className="min-w-0 flex-1">
        <ThemedText className="text-sm">{branchName}</ThemedText>
        <BranchAddress address={branchAddress} className="mt-1" />
      </View>
    </View>
  );

  const renderRow = (row: SummaryRow, index: number) =>
    plain ? (
      <View key={row.titleKey} className={index > 0 ? 'mt-4' : undefined}>
        <ThemedText className="text-sm font-semibold">{t(row.titleKey)}</ThemedText>
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {row.label}
        </ThemedText>
      </View>
    ) : (
      <View
        key={row.titleKey}
        className={`flex-row items-start gap-3 ${index > 0 ? 'mt-3' : ''}`}>
        <Icon name={row.icon} size={16} className="mt-0.5 text-light-subtext dark:text-dark-subtext" />
        <ThemedText className="flex-1 text-sm">{row.label}</ThemedText>
      </View>
    );

  return (
    <View className={plain ? undefined : 'rounded-2xl border border-light-secondary bg-light-secondary p-4 dark:border-dark-secondary dark:bg-dark-secondary'}>
      {renderRow(rows[0], 0)}
      <View className={plain ? 'mt-4' : 'mt-3'}>{branchBlock}</View>
      {rows.slice(1).map((row, index) => renderRow(row, index + 1))}
    </View>
  );
}
