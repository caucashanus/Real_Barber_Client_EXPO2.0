import React from 'react';
import { View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingContactSummaryPanel({ flow }: Props) {
  const { t } = flow;
  const dateLabel = flow.selectedDate ?? '—';
  const timeLabel = flow.selectedSlot?.start
    ? `${flow.selectedSlot.start}${flow.selectedSlot.end ? `–${flow.selectedSlot.end}` : ''}`
    : '—';

  const rows = [
    { icon: 'Calendar' as const, label: `${dateLabel} · ${timeLabel}` },
    {
      icon: 'MapPin' as const,
      label: [flow.selectedBranch?.name, flow.selectedBranch?.address].filter(Boolean).join(' · ') || '—',
    },
    {
      icon: 'Scissors' as const,
      label: flow.selectedService?.name ?? '—',
    },
    {
      icon: 'User' as const,
      label:
        flow.selectedEmployee?.displayName ??
        flow.selectedEmployee?.name ??
        flow.profileEmployee?.name ??
        '—',
    },
    ...(flow.selectedService?.pricing?.minPrice
      ? [
          {
            icon: 'CreditCard' as const,
            label: `${flow.selectedService.pricing.minPrice} ${t('reservationCurrencySuffix')}`,
          },
        ]
      : []),
  ];

  return (
    <View className="rounded-2xl border border-light-secondary bg-light-secondary p-4 dark:border-dark-secondary dark:bg-dark-secondary">
      {rows.map((row, index) => (
        <View
          key={`${row.icon}-${index}`}
          className={`flex-row items-start gap-3 ${index > 0 ? 'mt-3' : ''}`}>
          <Icon name={row.icon} size={16} className="mt-0.5 text-light-subtext dark:text-dark-subtext" />
          <ThemedText className="flex-1 text-sm">{row.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}
