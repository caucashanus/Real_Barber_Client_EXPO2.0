import type {
  HomepageNextSlot,
  HomepageTodayTeamBranch,
  HomepageTodayTeamMember,
  HomepageWorkInterval,
} from '@/api/homeTeamTypes';
import type { Locale } from '@/app/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { HOMEPAGE_TODAY_TEAM_MAX_SLOTS } from '@/constants/homepage';
import {
  getPragueMinutesFromDate,
  getPragueTodayDateString,
  pickTeamMemberLocalizedField,
} from '@/utils/teamMemberPageHelpers';
import { formatRelativeDayLabel, formatWaitlistDayWhen } from '@/utils/formatRelativeDayLabel';
import { shouldShowTeamMemberWaitlistCta } from '@/utils/teamMemberWaitlist';

export type HomeTodayShiftPhase = 'upcoming' | 'active' | 'ended' | 'none';
export type HomeTodayLiveDotVariant = 'green' | 'orange' | 'red';

export type HomeTodayTeamCardFooter =
  | { kind: 'hidden' }
  | {
      kind: 'slots';
      hint: string;
      slots: HomepageNextSlot[];
    }
  | { kind: 'message'; text: string }
  | { kind: 'waitlist'; branchId?: string }
  | { kind: 'noShift' };

export interface HomeTodayTeamCardModel {
  id: string;
  name: string;
  avatarUrl: string | null;
  branches: HomepageTodayTeamBranch[];
  shiftStatusLabel: string | null;
  shiftPhase: HomeTodayShiftPhase;
  liveDotVariant: HomeTodayLiveDotVariant | null;
  todaySlots: HomepageNextSlot[];
  sortSlotKey: number | null;
  waitlistBranchId?: string;
  waitlistDayIso: string;
  waitlistRequireActiveNow: boolean;
  footer: HomeTodayTeamCardFooter;
}

interface ParsedInterval {
  startTime: string;
  endTime: string;
  branchId: string;
  branchName: string;
  startMinutes: number;
  endMinutes: number;
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatShiftEndTimeLabel(endTime: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(endTime.trim());
  if (!match) return endTime;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (minutes === '00') return String(hours);
  return `${hours}:${minutes}`;
}

function getHomepageBranchName(branch: HomepageTodayTeamBranch, locale: Locale): string {
  return pickTeamMemberLocalizedField(branch, 'name', locale) ?? branch.name ?? '—';
}

function getHomepageMemberName(member: HomepageTodayTeamMember, locale: Locale): string {
  return pickTeamMemberLocalizedField(member, 'name', locale) ?? member.name ?? '—';
}

function resolveBranchName(
  branches: HomepageTodayTeamBranch[] | undefined,
  branchId: string,
  locale: Locale
): string {
  const branch = (branches ?? []).find((row) => row.id === branchId);
  return branch ? getHomepageBranchName(branch, locale) : '—';
}

function parseIntervals(
  workIntervals: HomepageWorkInterval[] | undefined,
  branches: HomepageTodayTeamBranch[] | undefined,
  locale: Locale
): ParsedInterval[] {
  if (!Array.isArray(workIntervals)) return [];
  const parsed: ParsedInterval[] = [];
  for (const interval of workIntervals) {
    const startMinutes = parseTimeToMinutes(interval.startTime);
    const endMinutes = parseTimeToMinutes(interval.endTime);
    if (startMinutes == null || endMinutes == null || !interval.branchId) continue;
    parsed.push({
      startTime: interval.startTime,
      endTime: interval.endTime,
      branchId: interval.branchId,
      branchName: resolveBranchName(branches, interval.branchId, locale),
      startMinutes,
      endMinutes,
    });
  }
  parsed.sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
  return parsed;
}

function pickRelevantInterval(
  intervals: ParsedInterval[],
  nowMinutes: number
): { phase: HomeTodayShiftPhase; interval: ParsedInterval | null } {
  if (intervals.length === 0) return { phase: 'none', interval: null };

  const active = intervals.find(
    (row) => nowMinutes >= row.startMinutes && nowMinutes < row.endMinutes
  );
  if (active) return { phase: 'active', interval: active };

  const upcoming = intervals.find((row) => nowMinutes < row.startMinutes);
  if (upcoming) return { phase: 'upcoming', interval: upcoming };

  return { phase: 'ended', interval: intervals[intervals.length - 1] ?? null };
}

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

function pickMidShiftLabel(
  interval: ParsedInterval,
  t: (key: TranslationKey) => string
): string {
  const variants = [
    interpolate(t('homeTodayTeamShiftWorking'), { branch: interval.branchName }),
    interpolate(t('homeTodayTeamShiftEndsAt'), {
      time: formatShiftEndTimeLabel(interval.endTime),
      branch: interval.branchName,
    }),
    interpolate(t('homeTodayTeamShiftInterval'), {
      start: interval.startTime,
      end: interval.endTime,
      branch: interval.branchName,
    }),
  ];
  return variants[Math.floor(Math.random() * variants.length)] ?? variants[0]!;
}

export function filterTodaySlots(
  slots: HomepageNextSlot[] | undefined,
  today: string
): HomepageNextSlot[] {
  return filterValidSlots(slots).filter((slot) => slot.date === today);
}

export function filterValidSlots(slots: HomepageNextSlot[] | undefined): HomepageNextSlot[] {
  if (!Array.isArray(slots)) return [];
  return slots
    .filter((slot) => Boolean(slot.date && slot.time && slot.branchId))
    .sort((a, b) => slotSortKey(a) - slotSortKey(b));
}

function buildSlotsHint(
  slots: HomepageNextSlot[],
  today: string,
  locale: Locale,
  t: (key: TranslationKey) => string
): string {
  if (slots.length === 0) return '';
  const firstDate = slots[0]!.date;
  if (firstDate === today) {
    return slots.length === 1
      ? t('barberNearestSlotTitle')
      : t('barberNearestSlotsTitle');
  }
  const when = formatWaitlistDayWhen(firstDate, today, locale);
  return interpolate(t('homeTodayTeamNearestSlotsOnDate'), { when });
}

function buildShiftStatusLabel(params: {
  phase: HomeTodayShiftPhase;
  interval: ParsedInterval | null;
  hasTodaySlots: boolean;
  nowMinutes: number;
  t: (key: TranslationKey) => string;
}): string | null {
  const { phase, interval, hasTodaySlots, nowMinutes, t } = params;
  if (phase === 'none' || !interval) return null;

  if (phase === 'ended') {
    return t('homeTodayTeamShiftEnded');
  }

  if (phase === 'upcoming') {
    const minutesUntilStart = interval.startMinutes - nowMinutes;
    if (minutesUntilStart > 60) {
      return interpolate(t('homeTodayTeamShiftStartsAt'), {
        time: interval.startTime,
        branch: interval.branchName,
      });
    }
    return interpolate(t('homeTodayTeamShiftStartsSoon'), { branch: interval.branchName });
  }

  if (!hasTodaySlots) {
    return t('barberFullyBookedToday');
  }

  const minutesUntilEnd = interval.endMinutes - nowMinutes;
  if (minutesUntilEnd <= 60) {
    return interpolate(t('homeTodayTeamShiftEndingSoon'), { branch: interval.branchName });
  }

  return pickMidShiftLabel(interval, t);
}

/** Tečka jen u holičů s dnešní směnou — barvy podle pražského času. */
export function buildLiveDotVariantFromShiftPhase(
  phase: HomeTodayShiftPhase
): HomeTodayLiveDotVariant | null {
  if (phase === 'active') return 'green';
  if (phase === 'upcoming') return 'orange';
  if (phase === 'ended') return 'red';
  return null;
}

function buildCardFooter(params: {
  phase: HomeTodayShiftPhase;
  shiftStatusLabel: string | null;
  allSlots: HomepageNextSlot[];
  workIntervals: HomepageWorkInterval[] | undefined;
  today: string;
  locale: Locale;
  waitlistBranchId?: string;
  t: (key: TranslationKey) => string;
}): HomeTodayTeamCardFooter {
  const { phase, shiftStatusLabel, allSlots, workIntervals, today, locale, waitlistBranchId, t } =
    params;
  const fullyBookedLabel = t('barberFullyBookedToday');
  const allValidSlots = filterValidSlots(allSlots);
  const todaySlots = filterTodaySlots(allValidSlots, today);
  const hasTodaySlots = todaySlots.length > 0;

  if (
    shouldShowTeamMemberWaitlistCta({
      workIntervals,
      nextSlots: allValidSlots,
      dayIso: today,
      requireActiveNow: true,
    })
  ) {
    return { kind: 'waitlist', branchId: waitlistBranchId };
  }

  const hasShift = (workIntervals?.length ?? 0) > 0;
  if (!hasShift && allValidSlots.length === 0) {
    return { kind: 'noShift' };
  }

  let displaySlots: HomepageNextSlot[] = [];

  if (phase === 'ended') {
    displaySlots = allValidSlots.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
  } else if (hasTodaySlots) {
    displaySlots = todaySlots.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
  }

  if (displaySlots.length > 0) {
    return {
      kind: 'slots',
      hint: buildSlotsHint(displaySlots, today, locale, t),
      slots: displaySlots,
    };
  }

  if (phase === 'ended') {
    return { kind: 'hidden' };
  }

  if (phase === 'upcoming' || phase === 'active') {
    if (shiftStatusLabel === fullyBookedLabel) {
      return { kind: 'hidden' };
    }
    return { kind: 'message', text: fullyBookedLabel };
  }

  return { kind: 'hidden' };
}

function slotSortKey(slot: HomepageNextSlot): number {
  const dateKey = Number(slot.date.replace(/-/g, ''));
  const minutes = parseTimeToMinutes(slot.time) ?? 0;
  if (!Number.isFinite(dateKey)) return minutes;
  return dateKey * 10_000 + minutes;
}

export function mergeTodayTeamWithAvailability(
  todayTeam: HomepageTodayTeamMember[] | undefined,
  availability: { employeeId: string; nextSlots?: HomepageNextSlot[] }[] | undefined
): Array<HomepageTodayTeamMember & { nextSlots: HomepageNextSlot[] }> {
  const availabilityMap = new Map(
    (availability ?? []).map((row) => [row.employeeId, row.nextSlots ?? []])
  );
  return (todayTeam ?? []).map((member) => ({
    ...member,
    nextSlots: availabilityMap.get(member.id) ?? [],
  }));
}

export function buildHomeTodayTeamCards(params: {
  members: Array<HomepageTodayTeamMember & { nextSlots: HomepageNextSlot[] }>;
  locale: Locale;
  t: (key: TranslationKey) => string;
  now?: Date;
  today?: string;
}): HomeTodayTeamCardModel[] {
  const now = params.now ?? new Date();
  const today = params.today ?? getPragueTodayDateString(now);
  const nowMinutes = getPragueMinutesFromDate(now);

  const cards = params.members.map((member) => {
    const intervals = parseIntervals(member.workIntervals, member.branches, params.locale);
    const { phase, interval } = pickRelevantInterval(intervals, nowMinutes);
    const allTodaySlots = filterTodaySlots(member.nextSlots, today);
    const hasTodaySlots = allTodaySlots.length > 0;
    const waitlistBranchId = interval?.branchId;

    let liveDotVariant = buildLiveDotVariantFromShiftPhase(phase);

    const shiftStatusLabel = buildShiftStatusLabel({
      phase,
      interval,
      hasTodaySlots,
      nowMinutes,
      t: params.t,
    });

    const footer = buildCardFooter({
      phase,
      shiftStatusLabel,
      allSlots: member.nextSlots,
      workIntervals: member.workIntervals,
      today,
      locale: params.locale,
      waitlistBranchId,
      t: params.t,
    });

    const displaySlots =
      footer.kind === 'slots' ? footer.slots : allTodaySlots.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
    const sortSlotKey = displaySlots[0] ? slotSortKey(displaySlots[0]) : null;

    return {
      id: member.id,
      name: getHomepageMemberName(member, params.locale),
      avatarUrl: member.avatarUrl?.trim() || null,
      branches: member.branches ?? [],
      shiftStatusLabel,
      shiftPhase: phase,
      liveDotVariant,
      todaySlots: displaySlots,
      sortSlotKey,
      waitlistBranchId,
      waitlistDayIso: today,
      waitlistRequireActiveNow: true,
      footer,
    };
  });

  return cards.sort((a, b) => {
    const aHasSlot = a.footer.kind === 'slots';
    const bHasSlot = b.footer.kind === 'slots';
    if (aHasSlot !== bHasSlot) return aHasSlot ? -1 : 1;

    if (aHasSlot && bHasSlot && a.sortSlotKey != null && b.sortSlotKey != null) {
      if (a.sortSlotKey !== b.sortSlotKey) return a.sortSlotKey - b.sortSlotKey;
    }

    const aWaitlist = a.footer.kind === 'waitlist';
    const bWaitlist = b.footer.kind === 'waitlist';
    if (aWaitlist !== bWaitlist) return aWaitlist ? -1 : 1;

    const aEnded = a.shiftPhase === 'ended';
    const bEnded = b.shiftPhase === 'ended';
    if (aEnded !== bEnded) return aEnded ? 1 : -1;

    const aRunningWithoutSlot = !aHasSlot && !aEnded && a.footer.kind !== 'waitlist';
    const bRunningWithoutSlot = !bHasSlot && !bEnded && b.footer.kind !== 'waitlist';
    if (aRunningWithoutSlot !== bRunningWithoutSlot) {
      return aRunningWithoutSlot ? -1 : 1;
    }

    return a.name.localeCompare(b.name, params.locale === 'cs' ? 'cs' : 'en');
  });
}

export function resolveHomeTodaySlotBranch(
  branches: HomepageTodayTeamBranch[],
  branchId: string,
  locale: Locale
): { branchName: string; branchAddress: string | null } {
  const branch = branches.find((row) => row.id === branchId);
  return {
    branchName: branch ? getHomepageBranchName(branch, locale) : '—',
    branchAddress: branch?.address ?? null,
  };
}
