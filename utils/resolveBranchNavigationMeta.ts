import {
  ALL_BRANCH_INTERNAL_IDS,
  getBranchContactMeta,
} from '@/constants/branchContacts';
import {
  resolveInternalBranchIdFromCrmUuid,
  type BranchInternalId,
} from '@/constants/crmBranchIds';
import type { BranchCardData } from '@/lib/rbicek/types';

export interface BranchNavigationMeta {
  branchName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

function normalizeBranchName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^real barber\s+/i, '')
    .trim();
}

const NAME_TO_INTERNAL: Record<string, BranchInternalId> = {
  modrany: 'modrany',
  modřany: 'modrany',
  barrandov: 'barrandov',
  kacerov: 'kacerov',
  kačerov: 'kacerov',
  hagibor: 'hagibor',
};

function resolveInternalBranchId(branch: BranchCardData): BranchInternalId | undefined {
  const fromCrm = resolveInternalBranchIdFromCrmUuid(branch.id);
  if (fromCrm) return fromCrm;

  if ((ALL_BRANCH_INTERNAL_IDS as string[]).includes(branch.id)) {
    return branch.id as BranchInternalId;
  }

  return NAME_TO_INTERNAL[normalizeBranchName(branch.name)];
}

export function resolveBranchNavigationMeta(branch: BranchCardData): BranchNavigationMeta {
  const internalId = resolveInternalBranchId(branch);
  if (internalId) {
    const meta = getBranchContactMeta(internalId);
    return {
      branchName: meta.shortLabel,
      address: meta.address,
      latitude: meta.latitude,
      longitude: meta.longitude,
    };
  }

  return {
    branchName: branch.name,
    address: branch.address,
  };
}
