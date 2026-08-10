import React, { useMemo } from 'react';
import { Pressable } from 'react-native';

import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { stripCzechPostalCodeFromAddress } from '@/utils/formatAddress';

export interface BranchAddressProps {
  address: string | null | undefined;
  className?: string;
  textClassName?: string;
  stripPostalCode?: boolean;
  numberOfLines?: number;
}

const ROW_CLASS = 'flex-row items-center gap-1.5 self-start';

/**
 * Jednotný řádek plné adresy pobočky — muted text + Copy (parity s web BranchAddress).
 */
export default function BranchAddress({
  address,
  className,
  textClassName = 'text-sm leading-5 text-light-subtext dark:text-dark-subtext',
  stripPostalCode = false,
  numberOfLines,
}: BranchAddressProps) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyFeedback();

  const display = useMemo(() => {
    const raw = address?.trim() ?? '';
    if (!raw) return '';
    const value = stripPostalCode ? stripCzechPostalCodeFromAddress(raw) : raw;
    return value.trim();
  }, [address, stripPostalCode]);

  if (!display) return null;

  const rowClassName = className ? `${ROW_CLASS} ${className}` : ROW_CLASS;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('branchCopyAddress')}
      onPress={(e) => {
        e.stopPropagation?.();
        copyToClipboard(display);
      }}
      className={`${rowClassName} active:opacity-70`}>
      <ThemedText className={`min-w-0 shrink ${textClassName}`} numberOfLines={numberOfLines}>
        {display}
      </ThemedText>
      <Icon
        name="Copy"
        size={12}
        className="shrink-0 text-light-subtext dark:text-dark-subtext"
      />
    </Pressable>
  );
}
