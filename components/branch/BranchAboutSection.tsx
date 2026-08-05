import React from 'react';
import { View } from 'react-native';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BranchAboutSectionProps {
  paragraphs: string[];
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
}

export default function BranchAboutSection({
  paragraphs,
  t,
  isFirst,
}: BranchAboutSectionProps) {
  if (paragraphs.length === 0) return null;

  return (
    <BranchContentCardSection title={t('branchAboutSalon')} isFirst={isFirst}>
      <View className="gap-3">
        {paragraphs.map((paragraph, index) => (
          <ThemedText
            key={index}
            className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {paragraph}
          </ThemedText>
        ))}
      </View>
    </BranchContentCardSection>
  );
}
