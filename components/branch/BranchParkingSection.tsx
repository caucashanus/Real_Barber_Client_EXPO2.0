import React from 'react';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import BranchMediaEmbed from '@/components/branch/BranchMediaEmbed';
import { buildVimeoEmbedUrl } from '@/utils/branchDetailVideoHelpers';
import type { TranslationKey } from '@/locales';

interface BranchParkingSectionProps {
  vimeoId: string;
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
}

export default function BranchParkingSection({
  vimeoId,
  t,
  isFirst,
}: BranchParkingSectionProps) {
  return (
    <BranchContentCardSection title={t('branchParkingMapTitle')} isFirst={isFirst}>
      <BranchMediaEmbed uri={buildVimeoEmbedUrl(vimeoId)} />
    </BranchContentCardSection>
  );
}
