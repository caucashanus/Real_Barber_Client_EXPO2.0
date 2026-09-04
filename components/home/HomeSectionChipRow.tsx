import React from 'react';

import AppButton from '@/components/AppButton';
import { CardScroller } from '@/components/CardScroller';
import type { HomeSectionChipItem } from '@/utils/homeScheduleDayChips';

interface HomeSectionChipRowProps {
  chips: HomeSectionChipItem[];
  className?: string;
}

export default function HomeSectionChipRow({ chips, className = '' }: HomeSectionChipRowProps) {
  if (chips.length === 0) return null;

  return (
    <CardScroller className={`mb-3 mt-3 ${className}`} space={8}>
      {chips.map((chip) => (
        <AppButton
          key={chip.id}
          variant="outline"
          size="sm"
          title={chip.label}
          href={chip.href}
        />
      ))}
    </CardScroller>
  );
}
