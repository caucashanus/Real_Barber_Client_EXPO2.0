import type { HomepageNextSlot } from '@/api/homeTeamTypes';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { resolveInternalBranchIdFromCrmUuid } from '@/constants/crmBranchIds';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import { resolveHomeTodaySlotBranch } from '@/utils/homeTodayTeamHelpers';
import type { Locale } from '@/app/contexts/LanguageContext';

export type NearestBranchHomeSlot = {
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  endTime: string;
  branchId: string;
  branchName: string;
  branchAddress: string | null;
};

const EMPTY: Record<BranchInternalId, NearestBranchHomeSlot[]> = {
  barrandov: [],
  hagibor: [],
  kacerov: [],
  modrany: [],
};

export function buildNearestBranchSlotsByInternalId(
  cards: HomeTodayTeamCardModel[],
  locale: Locale
): Record<BranchInternalId, NearestBranchHomeSlot[]> {
  const out: Record<BranchInternalId, NearestBranchHomeSlot[]> = {
    barrandov: [],
    hagibor: [],
    kacerov: [],
    modrany: [],
  };

  for (const card of cards) {
    const slots =
      card.footer.kind === 'slots'
        ? card.footer.slots
        : card.todaySlots.length > 0
          ? card.todaySlots
          : [];

    for (const slot of slots) {
      const internal = resolveInternalBranchIdFromCrmUuid(slot.branchId);
      if (!internal) continue;

      const { branchName, branchAddress } = resolveHomeTodaySlotBranch(
        card.branches,
        slot.branchId,
        locale
      );

      out[internal].push({
        employeeId: card.id,
        employeeName: card.name,
        date: slot.date,
        time: slot.time,
        endTime: slot.endTime ?? '',
        branchId: slot.branchId,
        branchName: branchName === '—' ? '' : branchName,
        branchAddress,
      });
    }
  }

  for (const id of Object.keys(out) as BranchInternalId[]) {
    out[id].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.time.localeCompare(b.time);
    });
  }

  return out;
}

export function emptyNearestBranchSlots(): Record<BranchInternalId, NearestBranchHomeSlot[]> {
  return { ...EMPTY };
}
