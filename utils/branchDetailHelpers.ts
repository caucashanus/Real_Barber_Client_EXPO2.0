import type { ImageSourcePropType } from 'react-native';

import type { Branch, BranchEmployee } from '@/api/branches';
import {
  branchCarouselImages,
  getBranchServicesList,
  getMediaUrlsSorted,
} from '@/utils/branchMediaHelpers';

export { branchCarouselImages, getBranchServicesList, getMediaUrlsSorted };

/** Marker logos per branch name (same as map markers). */
export const BRANCH_MARKER_IMAGES: Record<string, ImageSourcePropType> = {
  Hagibor: require('@/assets/img/markers/hagiborbarrandov.png'),
  HAGIBOR: require('@/assets/img/markers/hagiborbarrandov.png'),
  Kačerov: require('@/assets/img/markers/kacerovbarbershop.png'),
  Kaceřov: require('@/assets/img/markers/kacerovbarbershop.png'),
  Modřany: require('@/assets/img/markers/modranybarbershop.png'),
  Barrandov: require('@/assets/img/markers/barrandovbarbershop.png'),
};

const VR_TOUR_URL_BY_BRANCH_NAME: Record<string, string | null> = {
  Barrandov: null,
  Modřany: 'https://my.matterport.com/show/?m=SrYbx9DgJ3n',
  Kačerov: 'https://my.matterport.com/show/?m=YF7Q1K1ZiAX',
  Kaceřov: 'https://my.matterport.com/show/?m=YF7Q1K1ZiAX',
  Hagibor: 'https://my.matterport.com/show/?m=WPQ3ci9vZA1',
  HAGIBOR: 'https://my.matterport.com/show/?m=WPQ3ci9vZA1',
};

const MAPS_URL_BY_BRANCH_NAME: Record<string, string | null> = {
  Barrandov: 'https://maps.app.goo.gl/FeQCjmPMCJJZpUek6?g_st=ic',
  Hagibor: 'https://maps.app.goo.gl/BTTTnrQwpSJTkEqcA?g_st=ic',
  HAGIBOR: 'https://maps.app.goo.gl/BTTTnrQwpSJTkEqcA?g_st=ic',
  Kačerov: 'https://maps.app.goo.gl/GRYWbciVFmcjG2am6?g_st=ic',
  Kaceřov: 'https://maps.app.goo.gl/GRYWbciVFmcjG2am6?g_st=ic',
  Modřany: 'https://maps.app.goo.gl/nMvYPXrezmN8yPQJ9?g_st=ic',
};

export function getEmployeesList(branch: Branch): BranchEmployee[] {
  const e = branch.employees;
  if (!e) return [];
  if (Array.isArray(e)) return e;
  return Object.values(e);
}

export function getVrTourUrl(branchName: string): string | null {
  return VR_TOUR_URL_BY_BRANCH_NAME[branchName] ?? null;
}

export function getMapsUrl(branch: Branch): string | null {
  const fixed = MAPS_URL_BY_BRANCH_NAME[branch.name];
  if (fixed) return fixed;
  const query = branch.address || branch.name;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Remove leading "O pobočce" / "O poboččce" from branch description. */
export function stripDescriptionPrefix(text: string): string {
  return text.replace(/^o pobočč?e\s*/i, '').trimStart();
}

export function buildBranchReviewParams(branch: Branch): string {
  const branchImageUrl = getMediaUrlsSorted(branch.media)[0] ?? branch.imageUrl ?? '';
  return `entityType=branch&entityId=${encodeURIComponent(branch.id)}&entityName=${encodeURIComponent(branch.name)}${branchImageUrl ? `&entityImage=${encodeURIComponent(branchImageUrl)}` : ''}`;
}
