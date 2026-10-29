import React from 'react';
import { View } from 'react-native';

import BookingCountdownDisplay from '@/components/booking/BookingCountdownDisplay';

type Props = {
  target: Date;
  /** `xs` — pill v seznamu i v detailu (parita web ReservationCountdownPill). */
  textSize?: 'xs' | 'sm';
};

/** Live odpočet v zaobleném status pillu. */
export default function BookingCountdownPill({ target, textSize = 'xs' }: Props) {
  return (
    <View className="shrink-0 rounded-full bg-light-secondary px-2.5 py-1 dark:bg-dark-secondary">
      <BookingCountdownDisplay target={target} textSize={textSize} variant="pill" />
    </View>
  );
}
