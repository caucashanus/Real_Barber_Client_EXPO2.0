import React from 'react';
import { View } from 'react-native';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import ThemedText from '@/components/ThemedText';

interface BranchManagerSectionProps {
  title: string;
  paragraphs: string[];
  isFirst?: boolean;
}

export default function BranchManagerSection({
  title,
  paragraphs,
  isFirst,
}: BranchManagerSectionProps) {
  return (
    <BranchContentCardSection title={title} isFirst={isFirst}>
      {paragraphs.length > 0 ? (
        <View className="gap-3">
          {paragraphs.map((paragraph, index) => (
            <ThemedText
              key={index}
              className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {paragraph}
            </ThemedText>
          ))}
        </View>
      ) : null}
    </BranchContentCardSection>
  );
}
