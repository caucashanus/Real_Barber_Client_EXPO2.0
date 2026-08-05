import React from 'react';
import { Pressable } from 'react-native';

import { useCopyFeedback } from '@/app/contexts/CopyFeedbackContext';
import Icon from '@/components/Icon';

interface CopyIconButtonProps {
  value: string;
  size?: number;
  accessibilityLabel: string;
  className?: string;
  hitSlop?: number;
}

export default function CopyIconButton({
  value,
  size = 16,
  accessibilityLabel,
  className = 'shrink-0 active:opacity-60',
  hitSlop = 8,
}: CopyIconButtonProps) {
  const { copyToClipboard } = useCopyFeedback();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      className={className}
      onPress={() => copyToClipboard(value)}>
      <Icon name="Copy" size={size} className="opacity-80" />
    </Pressable>
  );
}
