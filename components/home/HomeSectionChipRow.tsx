import { router } from 'expo-router';
import React from 'react';

import { CardScroller } from '@/components/CardScroller';
import SlotTimePill from '@/components/SlotTimePill';
import type { HomeSectionChipItem } from '@/utils/homeScheduleDayChips';

interface HomeSectionChipRowProps {
  chips: HomeSectionChipItem[];
  className?: string;
}

/** Dny / CTA chipy — stejný pill jako Rozvrh (`SlotTimePill`), ne outline `sm`. */
export default function HomeSectionChipRow({ chips, className = '' }: HomeSectionChipRowProps) {
  if (chips.length === 0) return null;

  return (
    <CardScroller className={`mb-3 mt-3 ${className}`} space={8}>
      {chips.map((chip) => (
        <SlotTimePill
          key={chip.id}
          title={chip.label}
          onPress={() => router.push(chip.href as never)}
        />
      ))}
    </CardScroller>
  );
}
