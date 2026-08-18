import React from 'react';
import { View } from 'react-native';

import Icon from '@/components/Icon';
import {
  inlineTextAccessoryGapStyle,
  inlineTextAccessoryRowClassName,
} from '@/components/shared/BranchAddress';
import SoftChip from '@/components/shared/SoftChip';
import ThemedText from '@/components/ThemedText';
import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';

interface Props {
  flow: BookingEngineFlow;
  /** Stejný režim jako `BookingContactSummaryPanel` — card má ikonu vlevo jako ostatní řádky. */
  plain?: boolean;
}

export function shouldShowBookingHoldSummaryRow(flow: BookingEngineFlow): boolean {
  return Boolean(
    !flow.contact.submitSuccess &&
      flow.hold.countdownLabel &&
      (flow.step === 'contact' || flow.step === 'summary')
  );
}

export default function BookingHoldSummaryRow({ flow, plain = false }: Props) {
  const { t } = flow;
  const countdown = flow.hold.countdownLabel;
  const show = shouldShowBookingHoldSummaryRow(flow);

  if (!show) return null;

  const label = t('bookingHoldCountdownLabel');
  const ariaLabel = t('bookingHoldCountdownAria').replace('{time}', countdown);

  const row = (
    <View
      className={inlineTextAccessoryRowClassName}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={ariaLabel}>
      <ThemedText
        className={
          plain
            ? 'min-w-0 shrink text-sm font-semibold text-light-text dark:text-dark-text'
            : 'min-w-0 shrink text-sm text-light-text dark:text-dark-text'
        }>
        {label}
      </ThemedText>
      <View style={inlineTextAccessoryGapStyle}>
        <SoftChip title={countdown!} icon={null} className="shrink-0" />
      </View>
    </View>
  );

  if (plain) {
    return row;
  }

  return (
    <View className="flex-row items-center gap-3">
      <Icon name="Clock" size={16} className="text-light-subtext dark:text-dark-subtext" />
      <View className="min-w-0 flex-1">{row}</View>
    </View>
  );
}
