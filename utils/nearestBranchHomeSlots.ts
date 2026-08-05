import type { HomepageNextSlot } from '@/api/homeTeamTypes';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { resolveInternalBranchIdFromCrmUuid } from '@/constants/crmBranchIds';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import { resolveHomeTodaySlotBranch } from '@/utils/homeTodayTeamHelpers';
import type { Locale } from '@/contexts/LanguageContext';
import { formatRelativeDayLabel } from '@/utils/formatRelativeDayLabel';

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

const MAX_NEAREST_SLOTS = 16;

export function groupNearestBranchSlots(
  slots: NearestBranchHomeSlot[],
  locale: Locale,
  todayIso: string
): { dayLabel: string; slots: NearestBranchHomeSlot[] }[] {
  const limited = slots.slice(0, MAX_NEAREST_SLOTS);
  const order: string[] = [];
  const byDate = new Map<string, NearestBranchHomeSlot[]>();

  for (const slot of limited) {
    if (!byDate.has(slot.date)) {
      byDate.set(slot.date, []);
      order.push(slot.date);
    }
    byDate.get(slot.date)!.push(slot);
  }

  return order.map((date) => ({
    dayLabel: formatRelativeDayLabel({
      dayIso: date,
      todayIso,
      locale,
      variant: 'title',
    }),
    slots: byDate.get(date) ?? [],
  }));
}
