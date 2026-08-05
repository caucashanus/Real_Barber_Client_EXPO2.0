import React from 'react';

import CustomCard from '@/components/CustomCard';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BranchContentCardProps {
  children: React.ReactNode;
}

/** Obsahová karta pobočky (O salonu → Manažer) — stejný povrch a spacing jako Kontakty intro card. */
export default function BranchContentCard({ children }: BranchContentCardProps) {
  const sections = React.Children.toArray(children).filter(Boolean);

  return (
    <CustomCard
      rounded="2xl"
      padding="md"
      border
      background={false}
      className={`${BARBER_DETAIL_SECTION_SPACING} bg-light-secondary dark:bg-dark-secondary`}>
      {sections.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ isFirst?: boolean }>, {
              isFirst: index === 0,
            })
          : child
      )}
    </CustomCard>
  );
}

/** Horizontal padding inside `CustomCard` (`padding="md"` → p-4). */
export const BRANCH_CONTENT_CARD_HORIZONTAL_PADDING = 32;
