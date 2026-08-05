import React, { useMemo } from 'react';
import { useWindowDimensions, View, type ImageSourcePropType } from 'react-native';

import {
  BRANCH_CONTENT_CARD_HORIZONTAL_PADDING,
} from '@/components/branch/BranchContentCard';
import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import ImageCarousel from '@/components/ImageCarousel';
import { getBranchInteriorCarouselImages } from '@/constants/branchInteriorGallery';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { TranslationKey } from '@/locales';
import { CONTENT_HORIZONTAL_PADDING } from '@/utils/contentCarouselLayout';

interface BranchInteriorSectionProps {
  internalBranchId: BranchInternalId;
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
  sectionRef?: React.Ref<View>;
}

export default function BranchInteriorSection({
  internalBranchId,
  t,
  isFirst,
  sectionRef,
}: BranchInteriorSectionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const images = useMemo(
    () => getBranchInteriorCarouselImages(internalBranchId),
    [internalBranchId]
  );

  if (images.length === 0) return null;

  const carouselWidth =
    screenWidth - CONTENT_HORIZONTAL_PADDING - BRANCH_CONTENT_CARD_HORIZONTAL_PADDING;
  const carouselHeight = Math.round((carouselWidth * 2) / 3);

  return (
    <View ref={sectionRef}>
      <BranchContentCardSection title={t('branchInteriorTitle')} isFirst={isFirst}>
        <ImageCarousel
          images={images as ImageSourcePropType[]}
          width={carouselWidth}
          height={carouselHeight}
          showPagination={images.length > 1}
          paginationPlacement="below"
          autoPlay={images.length > 1}
          autoPlayInterval={3000}
          loop
          rounded="xl"
          imageBackgroundColor="#000000"
          className="w-full"
        />
      </BranchContentCardSection>
    </View>
  );
}
