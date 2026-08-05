import React from 'react';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import BranchMediaEmbed from '@/components/branch/BranchMediaEmbed';
import type { TranslationKey } from '@/locales';

interface BranchVirtualTourSectionProps {
  embedUrl: string;
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
}

export default function BranchVirtualTourSection({
  embedUrl,
  t,
  isFirst,
}: BranchVirtualTourSectionProps) {
  return (
    <BranchContentCardSection title={t('branchVirtualTourTitle')} isFirst={isFirst}>
      <BranchMediaEmbed uri={embedUrl} />
    </BranchContentCardSection>
  );
}
