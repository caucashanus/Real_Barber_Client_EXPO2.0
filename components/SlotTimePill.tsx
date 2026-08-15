import React from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';

/** Globální outfit pro nejbližší termíny (profil holiče). */
export const NEXT_SLOT_BUTTON_CLASS = 'h-8 rounded-lg px-2 py-1';
export const NEXT_SLOT_BUTTON_TEXT_CLASS = 'text-sm font-semibold tabular-nums';

/** Kompaktní varianta — karty holičů (Dnes k dispozici / Nejbližší termíny). */
export const NEXT_SLOT_BUTTON_COMPACT_CLASS = 'h-7 rounded-md px-1.5 py-0.5';
export const NEXT_SLOT_BUTTON_COMPACT_TEXT_CLASS = 'text-xs font-semibold tabular-nums';

const SLOT_PILL_SPACING_STYLE = { marginRight: 6, marginBottom: 6 } as const;

interface SlotTimePillProps {
  /** HH:MM — zobrazí se přes formatNextSlotDisplayTime. */
  time?: string;
  /** Vlastní text (např. „Další“, den v kalendáři), když není `time`. */
  title?: string;
  onPress?: () => void;
  selected?: boolean;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  /** Nedostupný den — šedý vzhled, stále klikací. */
  muted?: boolean;
  /** Menší pill pro úzké karty na stránce holičů. */
  compact?: boolean;
  /** Mezera mezi pills ve flex-wrap řádku (RN gap ne vždy funguje). */
  spaced?: boolean;
}

/** Choice tlačítko pro klik na nejbližší termín → booking handoff. */
export default function SlotTimePill({
  time,
  title,
  onPress,
  selected = false,
  className,
  textClassName,
  disabled = false,
  muted = false,
  compact = false,
  spaced = false,
}: SlotTimePillProps) {
  const displayTitle = time ? formatNextSlotDisplayTime(time) : (title ?? '');

  const button = (
    <AppButton
      variant="choice"
      size={compact ? 'xs' : 'sm'}
      title={displayTitle}
      selected={selected}
      onPress={onPress}
      disabled={disabled}
      disableHaptic
      className={[
        compact ? NEXT_SLOT_BUTTON_COMPACT_CLASS : NEXT_SLOT_BUTTON_CLASS,
        muted && !selected ? 'opacity-45' : '',
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

  if (!spaced) return button;

  return <View style={SLOT_PILL_SPACING_STYLE}>{button}</View>;
}
