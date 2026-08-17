import React from 'react';

import AppButton from '@/components/AppButton';
import {
  NEXT_SLOT_BUTTON_CLASS,
  NEXT_SLOT_BUTTON_COMPACT_CLASS,
  NEXT_SLOT_BUTTON_COMPACT_TEXT_CLASS,
  NEXT_SLOT_BUTTON_TEXT_CLASS,
} from '@/components/SlotTimePill';

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  locale?: 'cs' | 'en' | 'uk';
  onPress?: () => void;
  className?: string;
  textClassName?: string;
  /** Stejná kompaktní varianta jako next-slot pills na kartách týmu. */
  compact?: boolean;
}

function formatRatingValue(rating: number, locale: 'cs' | 'en' | 'uk'): string {
  const value = rating.toFixed(1);
  return locale === 'en' ? value : value.replace('.', ',');
}

/** Choice chip pro rating — stejný globální `AppButton choice` jako `SlotTimePill`. */
export default function RatingBadge({
  rating,
  reviewCount,
  locale = 'cs',
  onPress,
  className,
  textClassName,
  compact = true,
}: RatingBadgeProps) {
  const formatted = formatRatingValue(rating, locale);
  const label =
    reviewCount != null && reviewCount > 0
      ? `★ ${formatted} (${reviewCount})`
      : `★ ${formatted}`;

  return (
    <AppButton
      variant="choice"
      size={compact ? 'xs' : 'sm'}
      title={label}
      onPress={onPress}
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
