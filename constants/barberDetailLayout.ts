import { CONTENT_HORIZONTAL_PADDING } from '@/utils/contentCarouselLayout';

/** Vertical spacing between barber detail sections (tailwind `global` = 24px). */
export const BARBER_DETAIL_SECTION_SPACING = 'mb-global' as const;

/** Map tile on branch detail — slightly shorter than promo 3:2 carousel. */
export const BRANCH_DETAIL_MAP_ASPECT_RATIO = 16 / 10;

export function getBranchDetailMapSize(screenWidth: number) {
  const width = screenWidth - CONTENT_HORIZONTAL_PADDING;
  return {
    width,
    height: Math.round(width / BRANCH_DETAIL_MAP_ASPECT_RATIO),
  };
}
