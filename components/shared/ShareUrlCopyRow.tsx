import React from 'react';
import { View } from 'react-native';

import CopyIconButton from '@/components/shared/CopyIconButton';
import ThemedText from '@/components/ThemedText';

interface ShareUrlCopyRowProps {
  shareUrl: string;
  copyAccessibilityLabel: string;
  className?: string;
}

/** Read-only URL row + copy — stejné jako spodní blok ve `ProfileShareSheet`. */
export default function ShareUrlCopyRow({
  shareUrl,
  copyAccessibilityLabel,
  className = '',
}: ShareUrlCopyRowProps) {
  return (
    <View className={`flex-row items-center gap-2 ${className}`.trim()}>
      <ThemedText
        className="min-w-0 flex-1 text-xs text-light-subtext dark:text-dark-subtext"
        numberOfLines={1}>
        {shareUrl}
      </ThemedText>
      <CopyIconButton value={shareUrl} accessibilityLabel={copyAccessibilityLabel} />
    </View>
  );
}
