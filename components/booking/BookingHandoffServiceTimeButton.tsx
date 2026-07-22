import React from 'react';

import AppButton from '@/components/AppButton';
import {
  NEXT_SLOT_BUTTON_CLASS,
  NEXT_SLOT_BUTTON_TEXT_CLASS,
} from '@/components/SlotTimePill';

interface BookingHandoffServiceTimeButtonProps {
  title: string;
  selected?: boolean;
  onPress: () => void;
}

/** Slot-handoff service row — choice pill „Dnes v 16:30“. */
export default function BookingHandoffServiceTimeButton({
  title,
  selected = false,
  onPress,
}: BookingHandoffServiceTimeButtonProps) {
  return (
    <AppButton
      variant="choice"
      size="sm"
      title={title}
      selected={selected}
      onPress={onPress}
      className={NEXT_SLOT_BUTTON_CLASS}
      textClassName={NEXT_SLOT_BUTTON_TEXT_CLASS}
    />
  );
}
