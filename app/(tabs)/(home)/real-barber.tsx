import React from 'react';
import { View } from 'react-native';

import ThemeScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';

export default function RealBarberHomeTab() {
  return (
    <ThemeScroller className="flex-1">
      <View className="mt-4 px-global">
        <Section title="Real Barber" titleSize="lg" />
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          —
        </ThemedText>
      </View>
    </ThemeScroller>
  );
}

