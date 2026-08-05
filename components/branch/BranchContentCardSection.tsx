import React from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';

interface BranchContentCardSectionProps {
  title: string;
  /** First block in card — no `mt-5` above (Kontakty intro card parity). */
  isFirst?: boolean;
  children: React.ReactNode;
}

/** Title + content spacing inside branch content card — matches Kontakty intro card. */
export default function BranchContentCardSection({
  title,
  isFirst = false,
  children,
}: BranchContentCardSectionProps) {
  return (
    <View className={isFirst ? '' : 'mt-5'}>
      <ThemedText className="text-lg font-semibold">{title}</ThemedText>
      <View className="mt-3">{children}</View>
    </View>
  );
}
