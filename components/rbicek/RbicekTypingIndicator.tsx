import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';

export function RbicekTypingIndicator() {
  return (
    <View className="mb-4 flex-row justify-start px-4">
      <View className="rounded-2xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary">
        <ThemedText className="text-light-subtext dark:text-dark-subtext">…</ThemedText>
      </View>
    </View>
  );
}
