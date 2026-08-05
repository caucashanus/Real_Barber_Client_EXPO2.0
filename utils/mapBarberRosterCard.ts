import type {
  BarberRosterEmployee,
  BarberRosterResponse,
  BarberRosterSlot,
  BarberRosterWorkInterval,
} from '@/api/barbersRoster';
import type { HomepageNextSlot, HomepageTodayTeamBranch } from '@/api/homeTeamTypes';
import type { Locale } from '@/contexts/LanguageContext';
import { HOMEPAGE_TODAY_TEAM_MAX_SLOTS } from '@/constants/homepage';
import type { TranslationKey } from '@/locales';
import { formatRelativeDayLabel, formatWaitlistDayWhen } from '@/utils/formatRelativeDayLabel';
import {
  buildLiveDotVariantFromShiftPhase,
  filterTodaySlots,
  filterValidSlots,
  type HomeTodayShiftPhase,
  type HomeTodayTeamCardFooter,
  type HomeTodayTeamCardModel,
} from '@/utils/homeTodayTeamHelpers';
import {
  getPragueMinutesFromDate,
  getPragueTodayDateString,
  pickTeamMemberLocalizedField,
} from '@/utils/teamMemberPageHelpers';
import { shouldShowTeamMemberWaitlistCta } from '@/utils/teamMemberWaitlist';

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

function slotSortKey(slot: HomepageNextSlot): number {
  const dateKey = Number(slot.date.replace(/-/g, ''));
  const minutes = parseTimeToMinutes(slot.time) ?? 0;
  if (!Number.isFinite(dateKey)) return minutes;
  return dateKey * 10_000 + minutes;
}

function nearestSlotTimestamp(slot: HomepageNextSlot | null | undefined): number | null {
  if (!slot?.date || !slot?.time) return null;
  const key = slotSortKey(slot);
  return Number.isFinite(key) ? key : null;
}

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

function getBranchName(branch: HomepageTodayTeamBranch, locale: Locale): string {
  return pickTeamMemberLocalizedField(branch, 'name', locale) ?? branch.name ?? '—';
}

function getEmployeeName(employee: BarberRosterEmployee, locale: Locale): string {
  return pickTeamMemberLocalizedField(employee, 'name', locale) ?? employee.name ?? '—';
}

function resolveBranchName(
  branches: HomepageTodayTeamBranch[] | undefined,
  branchId: string,
  locale: Locale
): string {
  const branch = (branches ?? []).find((row) => row.id === branchId);
  return branch ? getBranchName(branch, locale) : '—';
}

function parseIntervals(
  workIntervals: BarberRosterWorkInterval[] | undefined,
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

function buildSlotsHint(
  slots: HomepageNextSlot[],
  dayIso: string,
  todayIso: string,
  isLiveDay: boolean,
  locale: Locale,
  t: (key: TranslationKey) => string
): string {
  if (slots.length === 0) return '';
  const firstDate = slots[0]!.date;
  const whenFor = (iso: string) => formatWaitlistDayWhen(iso, todayIso, locale);

  if (firstDate === dayIso) {
    if (isLiveDay && dayIso === todayIso) {
      return slots.length === 1
        ? t('barberNearestSlotTitle')
        : t('barberNearestSlotsTitle');
    }
    return interpolate(t('scheduleTermsWhen'), { when: whenFor(dayIso) });
  }

  return interpolate(t('homeTodayTeamNearestSlotsOnDate'), { when: whenFor(firstDate) });
}

function buildShiftStatusLabel(params: {
  phase: HomeTodayShiftPhase;
  interval: ParsedInterval | null;
  hasSlotsOnDay: boolean;
  nowMinutes: number;
  isLiveDay: boolean;
  t: (key: TranslationKey) => string;
}): string | null {
  const { phase, interval, hasSlotsOnDay, nowMinutes, isLiveDay, t } = params;
  if (!isLiveDay || phase === 'none' || !interval) return null;

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

  if (!hasSlotsOnDay) {
    return t('barberFullyBookedToday');
  }

  const minutesUntilEnd = interval.endMinutes - nowMinutes;
  if (minutesUntilEnd <= 60) {
    return interpolate(t('homeTodayTeamShiftEndingSoon'), { branch: interval.branchName });
  }

  return interpolate(t('homeTodayTeamShiftWorking'), { branch: interval.branchName });
}

function toHomepageSlots(slots: BarberRosterSlot[]): HomepageNextSlot[] {
  return filterValidSlots(slots as HomepageNextSlot[]);
}

function buildCardFooter(params: {
  phase: HomeTodayShiftPhase;
  shiftStatusLabel: string | null;
  allSlots: HomepageNextSlot[];
  slotsOnDay: HomepageNextSlot[];
  workIntervals: BarberRosterWorkInterval[];
  dayIso: string;
  todayIso: string;
  isLiveDay: boolean;
  locale: Locale;
  waitlistBranchId?: string;
  t: (key: TranslationKey) => string;
}): HomeTodayTeamCardFooter {
  const {
    phase,
    shiftStatusLabel,
    allSlots,
    slotsOnDay,
    workIntervals,
    dayIso,
    todayIso,
    isLiveDay,
    locale,
    waitlistBranchId,
    t,
  } = params;
  const fullyBookedLabel = isLiveDay
    ? t('barberFullyBookedToday')
    : t('barberFullyBookedThatDay');

  if (
    shouldShowTeamMemberWaitlistCta({
      workIntervals,
      nextSlots: allSlots,
      dayIso,
      requireActiveNow: isLiveDay,
    })
  ) {
    return { kind: 'waitlist', branchId: waitlistBranchId };
  }

  const hasShift = (workIntervals?.length ?? 0) > 0;
  if (!hasShift && allSlots.length === 0) {
    return { kind: 'noShift' };
  }

  let displaySlots: HomepageNextSlot[] = [];

  if (isLiveDay && phase === 'ended') {
    displaySlots = allSlots.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
  } else if (slotsOnDay.length > 0) {
    displaySlots = slotsOnDay.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
  } else if (!isLiveDay && allSlots.length > 0) {
    displaySlots = allSlots.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
  }

  if (displaySlots.length > 0) {
    return {
      kind: 'slots',
      hint: buildSlotsHint(displaySlots, dayIso, todayIso, isLiveDay, locale, t),
      slots: displaySlots,
    };
  }

  if (!isLiveDay) {
    return { kind: 'hidden' };
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

  if (allSlots.length > 0) {
    const fallback = allSlots.slice(0, HOMEPAGE_TODAY_TEAM_MAX_SLOTS);
    return {
      kind: 'slots',
      hint: buildSlotsHint(fallback, dayIso, todayIso, isLiveDay, locale, t),
      slots: fallback,
    };
  }

  return { kind: 'hidden' };
}

/** Sdílená Home-like karta holiče (Tým / Rozvrh). */
export function mapBarberRosterCard(params: {
  employee: BarberRosterEmployee;
  slots: BarberRosterSlot[];
  workIntervals: BarberRosterWorkInterval[];
  dayIso: string;
  todayIso: string;
  locale: Locale;
  t: (key: TranslationKey) => string;
  resolveLiveStatus?: boolean;
  now?: Date;
}): HomeTodayTeamCardModel {
  const now = params.now ?? new Date();
  const nowMinutes = getPragueMinutesFromDate(now);
  const branches = params.employee.branches ?? [];
  const isLiveDay = params.resolveLiveStatus !== false;
  const intervals = parseIntervals(params.workIntervals, branches, params.locale);
  const { phase, interval } = isLiveDay
    ? pickRelevantInterval(intervals, nowMinutes)
    : { phase: 'none' as HomeTodayShiftPhase, interval: null };

  const allSlots = toHomepageSlots(params.slots);
  const slotsOnDay = filterTodaySlots(allSlots, params.dayIso);
  const waitlistBranchId = interval?.branchId ?? intervals[0]?.branchId;

  const liveDotVariant =
    isLiveDay && intervals.length > 0 ? buildLiveDotVariantFromShiftPhase(phase) : null;

  const shiftStatusLabel = buildShiftStatusLabel({
    phase,
    interval,
    hasSlotsOnDay: slotsOnDay.length > 0,
    nowMinutes,
    isLiveDay,
    t: params.t,
  });

  const footer = buildCardFooter({
    phase,
    shiftStatusLabel,
    allSlots,
    slotsOnDay,
    workIntervals: params.workIntervals,
    dayIso: params.dayIso,
    todayIso: params.todayIso,
    isLiveDay,
    locale: params.locale,
    waitlistBranchId,
    t: params.t,
  });

  const displaySlots = footer.kind === 'slots' ? footer.slots : slotsOnDay;
  const sortSlotKeyValue = displaySlots[0] ? slotSortKey(displaySlots[0]) : null;

  return {
    id: params.employee.id,
    name: getEmployeeName(params.employee, params.locale),
    avatarUrl: params.employee.avatarUrl?.trim() || null,
    branches,
    shiftStatusLabel,
    shiftPhase: phase,
    liveDotVariant,
    todaySlots: displaySlots,
    sortSlotKey: sortSlotKeyValue,
    waitlistBranchId,
    waitlistDayIso: params.dayIso,
    waitlistRequireActiveNow: isLiveDay,
    footer,
  };
}

function homepageAvailabilityRank(
  todaySlotKey: number | null,
  phase: HomeTodayShiftPhase
): number {
  if (todaySlotKey != null) return 0;
  if (phase === 'upcoming' || phase === 'active') return 1;
  return 2;
}

function sortCardsByNearestSlot(cards: HomeTodayTeamCardModel[], locale: Locale): void {
  cards.sort((a, b) => {
    const tsA = a.sortSlotKey;
    const tsB = b.sortSlotKey;
    const rankA = tsA != null ? 0 : 1;
    const rankB = tsB != null ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    if (tsA != null && tsB != null && tsA !== tsB) return tsA - tsB;
    return a.name.localeCompare(b.name, locale === 'cs' ? 'cs' : 'en');
  });
}

function sortCardsByNearestSlotOnDay(
  cards: HomeTodayTeamCardModel[],
  dayIso: string,
  locale: Locale
): void {
  cards.sort((a, b) => {
    const tsA =
      a.footer.kind === 'slots'
        ? nearestSlotTimestamp(
            a.footer.slots.find((s) => s.date === dayIso) ?? a.footer.slots[0]
          )
        : null;
    const tsB =
      b.footer.kind === 'slots'
        ? nearestSlotTimestamp(
            b.footer.slots.find((s) => s.date === dayIso) ?? b.footer.slots[0]
          )
        : null;
    const rankA = homepageAvailabilityRank(tsA, a.shiftPhase);
    const rankB = homepageAvailabilityRank(tsB, b.shiftPhase);
    if (rankA !== rankB) return rankA - rankB;
    if (tsA != null && tsB != null && tsA !== tsB) return tsA - tsB;
    return a.name.localeCompare(b.name, locale === 'cs' ? 'cs' : 'en');
  });
}

export function mapRosterToTeamCards(
  roster: BarberRosterResponse,
  locale: Locale,
  t: (key: TranslationKey) => string,
  now?: Date
): HomeTodayTeamCardModel[] {
  const todayIso = roster.meta.date || getPragueTodayDateString(now);
  const cards = roster.employees.map((employee) => {
    const day = employee.byDate[todayIso];
    return mapBarberRosterCard({
      employee,
      slots: employee.nextSlots ?? [],
      workIntervals: day?.workIntervals ?? [],
      dayIso: todayIso,
      todayIso,
      locale,
      t,
      resolveLiveStatus: true,
      now,
    });
  });
  sortCardsByNearestSlot(cards, locale);
  return cards;
}

export function mapRosterToScheduleCardsByDate(
  roster: BarberRosterResponse,
  locale: Locale,
  t: (key: TranslationKey) => string,
  now?: Date
): Record<string, HomeTodayTeamCardModel[]> {
  const todayIso = roster.meta.date || getPragueTodayDateString(now);
  const byDate: Record<string, HomeTodayTeamCardModel[]> = {};

  for (const day of roster.days ?? []) {
    const isToday = day.date === todayIso;
    const cards: HomeTodayTeamCardModel[] = [];

    for (const employee of roster.employees) {
      const entry = employee.byDate[day.date];
      const workIntervals = entry?.workIntervals ?? [];
      if (workIntervals.length === 0) continue;

      cards.push(
        mapBarberRosterCard({
          employee,
          slots: entry?.slots ?? [],
          workIntervals,
          dayIso: day.date,
          todayIso,
          locale,
          t,
          resolveLiveStatus: isToday,
          now,
        })
      );
    }

    if (isToday) {
      sortCardsByNearestSlotOnDay(cards, day.date, locale);
    } else {
      sortCardsByNearestSlot(cards, locale);
    }

    byDate[day.date] = cards;
  }

  return byDate;
}

export function formatScheduleDayTabLabel(
  isoDate: string,
  todayIso: string,
  locale: Locale
): string {
  return formatRelativeDayLabel({
    dayIso: isoDate,
    todayIso,
    locale,
    variant: 'titleTab',
  });
}

export function buildScheduleDayTabs(
  roster: BarberRosterResponse,
  locale: Locale
): Array<{ date: string; label: string }> {
  const todayIso = roster.meta.date;
  return (roster.days ?? []).map((day) => ({
    date: day.date,
    label: formatScheduleDayTabLabel(day.date, todayIso, locale),
  }));
}
