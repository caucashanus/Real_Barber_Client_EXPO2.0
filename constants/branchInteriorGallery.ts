import type { ImageSourcePropType } from 'react-native';

import { getBranchContactMeta } from '@/constants/branchContacts';
import type { BranchInternalId } from '@/constants/crmBranchIds';

/** Statické S3 URL interiérů — stejný katalog jako web (`galleryImages` na detailu pobočky). */
export const BRANCH_INTERIOR_GALLERY_URLS: Record<BranchInternalId, readonly string[]> = {
  kacerov: [
    'https://s3.xrb.cz/site/2024/07/Kacerov-1.webp',
    'https://s3.xrb.cz/site/2024/07/Kacerov2.webp',
    'https://s3.xrb.cz/site/2024/07/Kacerov-3.webp',
    'https://s3.xrb.cz/site/2024/07/Kacerov.webp',
  ],
  modrany: [
    'https://s3.xrb.cz/site/2024/07/modrany-1.webp',
    'https://s3.xrb.cz/site/2024/07/Modrany2.webp',
    'https://s3.xrb.cz/site/2024/07/Modrazny.webp',
    'https://s3.xrb.cz/site/2024/07/Modrany-5.webp',
  ],
  hagibor: [
    'https://s3.xrb.cz/site/2024/12/IMAGE-2024-12-21-141941.webp',
    'https://s3.xrb.cz/site/2024/12/IMAGE-2024-12-21-142125.webp',
    'https://s3.xrb.cz/site/2024/12/IMAGE-2024-12-21-142128.webp',
  ],
  barrandov: [
    'https://s3.xrb.cz/site/2025/11/IMAGE-2025-11-19-160514-1024x682.webp',
  ],
};

export type BranchInteriorCarouselImage = string | ImageSourcePropType;

/** Galerie pro carousel v nearest draweru; fallback = lokální fotka pobočky. */
export function getBranchInteriorCarouselImages(
  branchId: BranchInternalId
): BranchInteriorCarouselImage[] {
  const gallery = BRANCH_INTERIOR_GALLERY_URLS[branchId];
  if (gallery.length > 0) return [...gallery];
  const fallback = getBranchContactMeta(branchId).carouselImage;
  return fallback ? [fallback] : [];
}
