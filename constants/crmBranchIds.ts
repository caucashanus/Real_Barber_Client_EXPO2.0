export type BranchInternalId = 'barrandov' | 'hagibor' | 'kacerov' | 'modrany';

/** CRM UUID pobočky — stejné mapování jako web. */
const CRM_BRANCH_ID_BY_INTERNAL: Record<BranchInternalId, string> = {
  barrandov: '3d17de69-36f0-4ff9-b944-6aad97e4d5f6',
  hagibor: '8adcfbc6-05d2-4330-80e7-785f02ad6753',
  kacerov: '57c45c57-1b27-4227-8e76-ec140d035c38',
  modrany: 'd15ee0b6-2e66-4edf-a4d1-5f87a89535a3',
};

const INTERNAL_BY_CRM_ID = Object.fromEntries(
  Object.entries(CRM_BRANCH_ID_BY_INTERNAL).map(([internal, crmId]) => [
    crmId,
    internal as BranchInternalId,
  ])
) as Record<string, BranchInternalId>;

export function resolveInternalBranchIdFromCrmUuid(
  crmId: string
): BranchInternalId | undefined {
  return INTERNAL_BY_CRM_ID[crmId.trim()];
}

export function resolveCrmBranchId(internal: BranchInternalId): string {
  return CRM_BRANCH_ID_BY_INTERNAL[internal];
}
