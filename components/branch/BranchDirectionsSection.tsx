import React from 'react';
import { View } from 'react-native';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import ThemedText from '@/components/ThemedText';
import type { BranchDirectionsSectionContent } from '@/constants/branchPageContent';
import type { TranslationKey } from '@/locales';

interface BranchDirectionsSectionProps {
  intro: string;
  sections: BranchDirectionsSectionContent[];
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
}

export default function BranchDirectionsSection({
  intro,
  sections,
  t,
  isFirst,
}: BranchDirectionsSectionProps) {
  if (!intro && sections.length === 0) return null;

  return (
    <BranchContentCardSection title={t('howToGetToUs')} isFirst={isFirst}>
      <View className="gap-4">
        {intro ? (
          <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {intro}
          </ThemedText>
        ) : null}
        {sections.map((section) => (
          <View key={section.title}>
            <ThemedText className="mb-1 text-sm font-semibold">{section.title}</ThemedText>
            {section.paragraphs.map((paragraph, index) => (
              <ThemedText
                key={index}
                className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                {paragraph}
              </ThemedText>
            ))}
          </View>
        ))}
      </View>
    </BranchContentCardSection>
  );
}
