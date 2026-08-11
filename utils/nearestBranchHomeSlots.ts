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
  duration?: number;
  branchId: string;
  branchName: string;
  branchAddress: string | null;
};

export type NearestBranchHomeSlotBranchGroup = {
  branchId: string;
  branchName: string;
  slots: NearestBranchHomeSlot[];
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

/** Skupiny podle pobočky — pořadí: více slotů dřív, při remíze dřívější první slot. */
export function groupNearestBranchHomeSlotsByBranch(
  slots: NearestBranchHomeSlot[]
): NearestBranchHomeSlotBranchGroup[] {
  const map = new Map<string, NearestBranchHomeSlotBranchGroup>();

  for (const slot of slots) {
    const key = slot.branchId.trim() || slot.branchName.trim();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.slots.push(slot);
      continue;
    }
    map.set(key, {
      branchId: slot.branchId,
      branchName: slot.branchName.trim() || slot.branchId,
      slots: [slot],
    });
  }

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      slots: [...group.slots].sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return a.time.localeCompare(b.time);
      }),
    }))
    .sort((a, b) => {
      const byCount = b.slots.length - a.slots.length;
      if (byCount !== 0) return byCount;
      const aFirst = a.slots[0];
      const bFirst = b.slots[0];
      if (aFirst && bFirst) {
        const byDate = aFirst.date.localeCompare(bFirst.date);
        if (byDate !== 0) return byDate;
        const byTime = aFirst.time.localeCompare(bFirst.time);
        if (byTime !== 0) return byTime;
      }
      return a.branchName.localeCompare(b.branchName, 'cs');
    });
}
