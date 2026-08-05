import type { BranchOpenStatusKind } from '@/utils/branchOpenStatus';

export type BranchOpenLiveVariant = 'green' | 'orange' | 'red';

export function getBranchOpenLiveVariant(kind: BranchOpenStatusKind): BranchOpenLiveVariant {
  switch (kind) {
    case 'open':
      return 'green';
    case 'openingSoon':
    case 'closingSoon':
      return 'orange';
    case 'closed':
    default:
      return 'red';
  }
}
