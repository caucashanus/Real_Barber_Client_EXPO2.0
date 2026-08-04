import type {
  EmployeeTodaySlot,
  TeamMemberPageBranch,
  TeamMemberPageEmployee,
  TeamMemberPageReview,
  TeamMemberShiftDay,
} from '@/api/publicTeamMember';
import type { Locale } from '@/app/contexts/LanguageContext';
import { formatRelativeDayLabel } from '@/utils/formatRelativeDayLabel';

type LocalizedEntity = Record<string, unknown>;

export type TodayShiftStatus = 'active' | 'upcoming' | 'ended' | 'none';

export type TodayAvailabilityState = 'slots' | 'unavailable' | 'full';

export interface ShiftCalendarRow {
  date: string;
  dayTitle: string;
  startTime: string;
  endTime: string;
  branchId: string;
  branchName: string;
  branchAddress: string | null;
}

export interface BarberBookingParams {
  employeeId: string;
  branchId?: string;
  date?: string;
  slotStart?: string;
  itemId?: string;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function getPragueMinutesFromDate(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

function intlLocaleTag(locale: Locale | string): string {
  if (locale === 'cs' || locale.startsWith('cs')) return 'cs-CZ';
  if (locale === 'uk' || locale.startsWith('uk')) return 'uk-UA';
  return 'en-GB';
}

export function getTodayShiftStatus(
  shiftCalendar: TeamMemberShiftDay[] | undefined,
  today: string,
  now = new Date()
): TodayShiftStatus {
  if (!hasShiftOnDate(shiftCalendar, today)) return 'none';

  const day = shiftCalendar!.find((row) => row.date === today);
  const intervals = day?.workIntervals ?? [];
  if (intervals.length === 0) return 'none';

  const nowMinutes = getPragueMinutesFromDate(now);
  let hasActive = false;
  let hasUpcoming = false;
  let allEnded = true;

  for (const interval of intervals) {
    const start = parseTimeToMinutes(interval.startTime);
    const end = parseTimeToMinutes(interval.endTime);
    if (start == null || end == null) continue;
    if (nowMinutes >= start && nowMinutes < end) hasActive = true;
    if (nowMinutes < start) hasUpcoming = true;
    if (nowMinutes < end) allEnded = false;
  }

  if (hasActive) return 'active';
  if (hasUpcoming) return 'upcoming';
  if (allEnded) return 'ended';
  return 'none';
}

export function getTodayActiveWaitlistBranchId(
  shiftCalendar: TeamMemberShiftDay[] | undefined,
  today: string,
  now = new Date()
): string | undefined {
  const day = shiftCalendar?.find((row) => row.date === today);
  const intervals = day?.workIntervals ?? [];
  if (intervals.length === 0) return undefined;

  const nowMinutes = getPragueMinutesFromDate(now);
  for (const interval of intervals) {
    const start = parseTimeToMinutes(interval.startTime);
    const end = parseTimeToMinutes(interval.endTime);
    if (start == null || end == null) continue;
    if (nowMinutes >= start && nowMinutes < end) return interval.branchId;
  }

  return intervals[0]?.branchId;
}

export function getShiftLiveIndicatorVariant(
  status: TodayShiftStatus
): 'green' | 'orange' | 'red' | null {
  if (status === 'active') return 'green';
  if (status === 'upcoming') return 'orange';
  if (status === 'ended') return 'red';
  return null;
}

export function getTodayAvailabilityState(
  todaySlots: EmployeeTodaySlot[],
  shiftStatus: TodayShiftStatus
): TodayAvailabilityState | null {
  if (todaySlots.length > 0) return 'slots';
  if (shiftStatus === 'none') return null;
  if (shiftStatus === 'ended') return 'unavailable';
  return 'full';
}

export function getShiftDayTitle(date: string, today: string, locale: Locale): string {
  return formatRelativeDayLabel({
    dayIso: date,
    todayIso: today,
    locale,
    variant: 'title',
  });
}

export function flattenShiftCalendarRows(
  shiftCalendar: TeamMemberShiftDay[] | undefined,
  branches: TeamMemberPageBranch[] | undefined,
  today: string,
  locale: Locale
): ShiftCalendarRow[] {
  if (!Array.isArray(shiftCalendar)) return [];
  const branchMap = new Map((branches ?? []).map((branch) => [branch.id, branch]));
  const rows: ShiftCalendarRow[] = [];

  for (const day of shiftCalendar) {
    for (const interval of day.workIntervals ?? []) {
      if (!interval.branchId || !interval.startTime || !interval.endTime) continue;
      const branch = branchMap.get(interval.branchId);
      rows.push({
        date: day.date,
        dayTitle: getShiftDayTitle(day.date, today, locale),
        startTime: interval.startTime,
        endTime: interval.endTime,
        branchId: interval.branchId,
        branchName: branch ? getTeamMemberBranchName(branch, locale) : '—',
        branchAddress: branch?.address ?? null,
      });
    }
  }

  return rows;
}

export function paginateShiftRowsByDayCount(
  rows: ShiftCalendarRow[],
  visibleDayCount: number
): ShiftCalendarRow[] {
  const uniqueDates = [...new Set(rows.map((row) => row.date))];
  const visibleDates = new Set(uniqueDates.slice(0, visibleDayCount));
  return rows.filter((row) => visibleDates.has(row.date));
}

export function getUniqueShiftDayCount(rows: ShiftCalendarRow[]): number {
  return new Set(rows.map((row) => row.date)).size;
}

export function buildBarberBookingHref(params: BarberBookingParams): string {
  const q = new URLSearchParams();
  q.set('recipe', 'employee-profile');
  q.set('employeeId', params.employeeId);
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.itemId) q.set('itemId', params.itemId);
  if (params.date) q.set('date', params.date);
  if (params.slotStart) q.set('slotStart', params.slotStart);
  return `/screens/reservation-create?${q.toString()}`;
}

export function getTeamMemberPhone(employee: TeamMemberPageEmployee): string | null {
  return (
    readString(employee.phone) ??
    readString(employee.contactPhone) ??
    readString(employee.mobile)
  );
}

export function isShiftCalendarConfigured(
  shiftCalendar: TeamMemberShiftDay[] | undefined
): boolean {
  return Array.isArray(shiftCalendar);
}

export function hasAnyShiftRows(shiftCalendar: TeamMemberShiftDay[] | undefined): boolean {
  if (!Array.isArray(shiftCalendar)) return false;
  return shiftCalendar.some((day) => (day.workIntervals?.length ?? 0) > 0);
}

/** Picks `field`, then `fieldEn` / `fieldUk` based on locale (app: cs | en). */
export function pickTeamMemberLocalizedField(
  entity: object,
  field: string,
  locale: Locale
): string | null {
  const record = entity as LocalizedEntity;
  if (locale === 'en') {
    const en = readString(record[`${field}En`]);
    if (en) return en;
  }
  return readString(record[field]);
}

export function getTeamMemberDisplayName(employee: TeamMemberPageEmployee, locale: Locale): string {
  return (
    pickTeamMemberLocalizedField(employee, 'displayName', locale) ??
    pickTeamMemberLocalizedField(employee, 'name', locale) ??
    employee.name ??
    '—'
  );
}

export function getTeamMemberBio(employee: TeamMemberPageEmployee, locale: Locale): string | null {
  return (
    pickTeamMemberLocalizedField(employee, 'bio', locale) ??
    pickTeamMemberLocalizedField(employee, 'description', locale)
  );
}

export function getTeamMemberBranchName(branch: TeamMemberPageBranch, locale: Locale): string {
  return pickTeamMemberLocalizedField(branch, 'name', locale) ?? branch.name ?? '—';
}

/** Branch label for barber detail — street + city, without PSČ. */
export function formatBranchAddressShort(address: string | null | undefined): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;

  const withoutPostal = trimmed
    .replace(/\b\d{3}\s?\d{2}\b/g, ' ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .replace(/^\s*,\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return withoutPostal || trimmed;
}

export function getPragueTodayDateString(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return y && m && d ? `${y}-${m}-${d}` : now.toISOString().slice(0, 10);
}

export function filterValidTodaySlots(slots: EmployeeTodaySlot[] | undefined): EmployeeTodaySlot[] {
  if (!Array.isArray(slots)) return [];
  return slots.filter((slot) => Boolean(slot.date && slot.time && slot.branchId));
}

export function hasShiftOnDate(
  shiftCalendar: TeamMemberShiftDay[] | undefined,
  date: string
): boolean {
  if (!Array.isArray(shiftCalendar)) return false;
  const day = shiftCalendar.find((row) => row.date === date);
  return Boolean(day?.workIntervals && day.workIntervals.length > 0);
}

export function branchesFromShiftCalendar(
  employee: TeamMemberPageEmployee,
  shiftCalendar: TeamMemberShiftDay[] | undefined
): TeamMemberPageBranch[] {
  const allBranches = employee.branches ?? [];
  if (!Array.isArray(shiftCalendar) || allBranches.length === 0) return [];

  const branchIds = new Set<string>();
  for (const day of shiftCalendar) {
    for (const interval of day.workIntervals ?? []) {
      if (interval.branchId) branchIds.add(interval.branchId);
    }
  }
  if (branchIds.size === 0) return [];

  return allBranches.filter((branch) => branchIds.has(branch.id));
}

export function buildReviewStatsFromPage(reviews: TeamMemberPageReview[] | undefined) {
  const countByRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const list = Array.isArray(reviews) ? reviews : [];
  let sum = 0;
  for (const review of list) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating) || 0));
    countByRating[rating] = (countByRating[rating] ?? 0) + 1;
    sum += review.rating;
  }
  const total = list.length;
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { countByRating, average, total };
}

export function buildBarberReviewParamsFromPage(employee: TeamMemberPageEmployee): string {
  const employeeImageUrl = employee.avatarUrl ?? '';
  const name = employee.name ?? '';
  return `entityType=employee&entityId=${encodeURIComponent(employee.id)}&entityName=${encodeURIComponent(name)}${employeeImageUrl ? `&entityImage=${encodeURIComponent(employeeImageUrl)}` : ''}`;
}

export function getTeamMemberProfileShareUrl(
  employee: TeamMemberPageEmployee,
  locale: Locale
): string {
  const url = pickTeamMemberLocalizedField(employee, 'webUrl', locale);
  if (url) {
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }
  return `realbarber://screens/barber-detail?id=${encodeURIComponent(employee.id)}`;
}

export function buildTeamMemberShareMessage(displayName: string, profileUrl: string): string {
  return `${displayName} — Real Barber\n${profileUrl}`;
}

export function hasSkillContent(employee: TeamMemberPageEmployee): boolean {
  const hairstyle = employee.hairstyleSkills ?? {};
  const coloring = employee.coloringSkills ?? {};
  const favorites = employee.favoriteServices ?? [];
  return (
    Object.keys(hairstyle).length > 0 ||
    Object.keys(coloring).length > 0 ||
    favorites.length > 0
  );
}
