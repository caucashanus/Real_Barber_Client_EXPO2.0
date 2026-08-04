import type { BranchInternalId } from '@/constants/crmBranchIds';

/** Stejné odkazy jako web footer / nearest branch menu. */
export const BRANCH_GOOGLE_REVIEW_URLS: Record<BranchInternalId, string> = {
  kacerov: 'https://g.page/r/CdLk-eHKLLSSEBE/review',
  modrany: 'https://g.page/r/CeBCT4OVPRpaEBE/review',
  hagibor: 'https://g.page/r/CSmohjjxcdp5EBM/review',
  barrandov: 'https://g.page/r/CS9JkIMUuAszEBM/review',
};

export function getBranchGoogleReviewUrl(branchId: BranchInternalId): string {
  return BRANCH_GOOGLE_REVIEW_URLS[branchId];
}
