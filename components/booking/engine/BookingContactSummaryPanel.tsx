import React from 'react';
import { View } from 'react-native';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { formatBookingSummaryDatetimeLabel } from '@/utils/reservationCreateHelpers';

interface Props {
  flow: BookingEngineFlow;
  hideCatalogPrice?: boolean;
  plain?: boolean;
}

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

  const rows = [
    {
      icon: 'Calendar' as const,
      titleKey: 'bookingProgressDatetime' as const,
      label: datetimeLabel,
    },
    {
      icon: 'MapPin' as const,
      titleKey: 'bookingProgressBranch' as const,
      label: [flow.selectedBranch?.name, flow.selectedBranch?.address].filter(Boolean).join(' · ') || '—',
    },
    {
      icon: 'Scissors' as const,
      titleKey: 'bookingProgressService' as const,
      label: flow.selectedService?.name ?? '—',
    },
    {
      icon: 'User' as const,
      titleKey: 'haircutBarber' as const,
      label: employeeName,
    },
    ...(flow.selectedService?.pricing?.minPrice && !hideCatalogPrice
      ? [
          {
            icon: 'CreditCard' as const,
            titleKey: 'bookingSummaryPrice' as const,
            label: `${flow.selectedService.pricing.minPrice} ${t('reservationCurrencySuffix')}`,
          },
        ]
      : []),
  ];

  return (
    <View className={plain ? undefined : 'rounded-2xl border border-light-secondary bg-light-secondary p-4 dark:border-dark-secondary dark:bg-dark-secondary'}>
      {rows.map((row, index) =>
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
        )
      )}
    </View>
  );
}
