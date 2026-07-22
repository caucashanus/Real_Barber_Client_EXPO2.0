import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { getBranchThemeColorCss } from '@/lib/booking/designShared';

interface BranchItem {
  id: string;
  name?: string;
}

interface Props {
  branches: BranchItem[];
}

export default function BookingMultiBranchCalendarLegend({ branches }: Props) {
  if (branches.length === 0) return null;

  return (
    <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
      {branches.map((branch) => (
        <View key={branch.id} className="flex-row items-center gap-1.5">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: getBranchThemeColorCss(branch) }}
          />
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
            {branch.name?.trim() ?? branch.id}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
