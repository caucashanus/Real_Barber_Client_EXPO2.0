import React from 'react';

import SlotTimePill from '@/components/SlotTimePill';

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
  return <SlotTimePill title={title} selected={selected} onPress={onPress} />;
}
