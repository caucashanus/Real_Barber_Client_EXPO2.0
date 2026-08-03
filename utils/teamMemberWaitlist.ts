import type { BarberRosterWorkInterval } from '@/api/barbersRoster';
import type { HomepageNextSlot } from '@/api/homeTeamTypes';
import { getPragueMinutesFromDate } from '@/utils/teamMemberPageHelpers';

type WaitlistWorkInterval = Pick<BarberRosterWorkInterval, 'startTime' | 'endTime'>;
type WaitlistSlot = Pick<HomepageNextSlot, 'date'>;

function timeStringToMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
  return hours * 60 + minutes;
}

export function isNowWithinWorkIntervals(
  intervals: WaitlistWorkInterval[] | null | undefined
): boolean {
  if (!intervals?.length) return false;
  const now = getPragueMinutesFromDate(new Date());
  for (const interval of intervals) {
    if (interval?.startTime == null || interval?.endTime == null) continue;
    const start = timeStringToMinutes(String(interval.startTime));
    const end = timeStringToMinutes(String(interval.endTime));
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start === end) continue;
    if (end > start) {
      if (now >= start && now <= end) return true;
    } else if (now >= start || now <= end) {
      return true;
    }
  }
  return false;
}

export function hasAvailabilitySlotOnDay(
  slots: WaitlistSlot[] | null | undefined,
  isoDay: string
): boolean {
  if (!slots?.length || !isoDay) return false;
  return slots.some((slot) => slot.date === isoDay);
}

/**
 * CTA čekací listiny.
 *
 * Live den (requireActiveNow=true): právě na směně + žádný slot ten den.
 * Budoucí den Rozvrhu (requireActiveNow=false): má směnu ten den + žádný slot ten den.
 */
export function shouldShowTeamMemberWaitlistCta(params: {
  workIntervals?: WaitlistWorkInterval[] | null;
  nextSlots?: WaitlistSlot[] | null;
  dayIso: string;
  requireActiveNow?: boolean;
}): boolean {
  if (!params.dayIso) return false;
  const intervals = params.workIntervals;
  if (!intervals?.length) return false;

  const requireActiveNow = params.requireActiveNow !== false;
  if (requireActiveNow && !isNowWithinWorkIntervals(intervals)) {
    return false;
  }

  return !hasAvailabilitySlotOnDay(params.nextSlots, params.dayIso);
}

export function teamMemberWaitlistSessionKey(
  employeeId: string,
  dayIso?: string | null
): string {
  const day = dayIso?.trim();
  return day
    ? `rb-team-waitlist:${employeeId}:${day}`
    : `rb-team-waitlist:${employeeId}`;
}
