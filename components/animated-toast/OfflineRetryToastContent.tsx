import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';

const TOAST_MASCOT = require('@/assets/img/copy-feedback-toast.png');

interface Props {
  message: string;
}

export default function OfflineRetryToastContent({ message }: Props) {
  return (
    <View className="flex-row items-center gap-3">
      <Image
        source={TOAST_MASCOT}
        style={{ width: 52, height: 52 }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
      <ThemedText className="min-w-0 flex-1 text-sm font-medium text-white">{message}</ThemedText>
    </View>
  );
}