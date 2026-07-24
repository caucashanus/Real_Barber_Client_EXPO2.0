import React from 'react';

import AppButton from '@/components/AppButton';
import {
  NEXT_SLOT_BUTTON_CLASS,
  NEXT_SLOT_BUTTON_COMPACT_CLASS,
  NEXT_SLOT_BUTTON_COMPACT_TEXT_CLASS,
  NEXT_SLOT_BUTTON_TEXT_CLASS,
} from '@/components/SlotTimePill';

interface ChoiceChipLabelProps {
  label: string;
  className?: string;
  textClassName?: string;
  /** Kompaktní varianta jako next-slot na kartách týmu. */
  compact?: boolean;
}

/** Display-only choice chip — stejný globální `AppButton choice` jako `SlotTimePill` / `RatingBadge`. */
export default function ChoiceChipLabel({
  label,
  className,
  textClassName,
  compact = true,
}: ChoiceChipLabelProps) {
  return (
    <AppButton
      variant="choice"
      size={compact ? 'xs' : 'sm'}
      title={label}
      disableHaptic
      className={[
        compact ? NEXT_SLOT_BUTTON_COMPACT_CLASS : NEXT_SLOT_BUTTON_CLASS,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      textClassName={[
        compact ? NEXT_SLOT_BUTTON_COMPACT_TEXT_CLASS : NEXT_SLOT_BUTTON_TEXT_CLASS,
        textClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
