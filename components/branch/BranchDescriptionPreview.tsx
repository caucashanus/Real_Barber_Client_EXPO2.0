import React from 'react';

import useThemeColors from '@/app/contexts/ThemeColors';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { stripDescriptionPrefix } from '@/utils/branchDetailHelpers';

interface BranchDescriptionPreviewProps {
  description: string;
  onReadMore: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchDescriptionPreview({
  description,
  onReadMore,
  t,
}: BranchDescriptionPreviewProps) {
  const colors = useThemeColors();
  const descriptionClean = stripDescriptionPrefix(description);
  if (!descriptionClean) return null;

  return (
    <Section title={t('branchDescription')} titleSize="lg" className="mb-2 mt-2">
      <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
        {descriptionClean.length > 50
          ? `${descriptionClean.slice(0, 50).trim()}… `
          : descriptionClean}
        {descriptionClean.length > 50 ? (
          <ThemedText
            onPress={onReadMore}
            style={{ color: colors.highlight }}
            className="text-base font-medium">
            {t('branchReadMore')}
          </ThemedText>
        ) : null}
      </ThemedText>
    </Section>
  );
}
