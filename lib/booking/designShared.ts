import type { BookingEntity } from '@/lib/booking/constants';

export function resolveBranchName(
  branchId: string | undefined,
  branches: BookingEntity[],
  profileBranches: { id: string; name?: string }[] = []
): string | undefined {
  if (!branchId) return undefined;
  const fromProfile = profileBranches.find((b) => b.id === branchId);
  if (fromProfile?.name) return fromProfile.name;
  const fromList = branches.find((b) => b.id === branchId);
  return fromList?.name ?? branchId;
}

const RELATIVE_DAY: Record<'cs' | 'en', { today: string; tomorrow: string; dayAfter: string }> = {
  cs: { today: 'Dnes', tomorrow: 'Zítra', dayAfter: 'Pozítří' },
  en: { today: 'Today', tomorrow: 'Tomorrow', dayAfter: 'Day after tomorrow' },
};

function formatDateShort(dateStr: string, locale: 'cs' | 'en'): string {
  const part = dateStr.slice(0, 10);
  const [, m, d] = part.split('-');
  if (!d || !m) return part;
  try {
    const [y] = part.split('-').map(Number);
    const dt = new Date(y, Number(m) - 1, Number(d));
    return dt.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      day: 'numeric',
      month: 'numeric',
    });
  } catch {
    return `${d}. ${parseInt(m, 10)}.`;
  }
}

export function formatNearestTermLabel(dateStr: string, locale: 'cs' | 'en' = 'cs'): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const part = dateStr.slice(0, 10);
  const [y, m, d] = part.split('-').map(Number);
  if (Number.isNaN(d) || Number.isNaN(m)) return formatDateShort(dateStr, locale);

  const slotDate = new Date(y, m - 1, d);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((slotDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
  const rel = RELATIVE_DAY[locale];

  if (diffDays === 0) return rel.today;
  if (diffDays === 1) return rel.tomorrow;
  if (diffDays === 2) return rel.dayAfter;
  if (diffDays >= 3 && diffDays <= 6) {
    const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
    const wd = slotDate.toLocaleDateString(tag, { weekday: 'long' });
    const dayLabel = wd ? wd.charAt(0).toLocaleUpperCase(tag) + wd.slice(1) : '';
    const dateShort = formatDateShort(part, locale);
    return dateShort ? `${dayLabel} ${dateShort}` : dayLabel;
  }
  return formatDateShort(dateStr, locale);
}

const BOOKING_RELATIVE_DAY: Record<'cs' | 'en', { today: string; tomorrow: string; dayAfter: string }> = {
  cs: { today: 'dnes', tomorrow: 'zítra', dayAfter: 'pozítří' },
  en: { today: 'today', tomorrow: 'tomorrow', dayAfter: 'day after tomorrow' },
};

/** Relative day label for booking employee list — lowercase in sentence (zítra · 14:30). */
export function formatBookingEmployeeNearestDayLabel(
  dateStr: string,
  locale: 'cs' | 'en' = 'cs'
): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const part = dateStr.slice(0, 10);
  const [y, m, d] = part.split('-').map(Number);
  if (Number.isNaN(d) || Number.isNaN(m)) return formatDateShort(dateStr, locale);

  const slotDate = new Date(y, m - 1, d);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((slotDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
  const rel = BOOKING_RELATIVE_DAY[locale];

  if (diffDays === 0) return rel.today;
  if (diffDays === 1) return rel.tomorrow;
  if (diffDays === 2) return rel.dayAfter;
  if (diffDays >= 3 && diffDays <= 6) {
    const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
    const wd = slotDate.toLocaleDateString(tag, { weekday: 'long' });
    const dayLabel = wd ? wd.toLocaleLowerCase(tag) : '';
    const dateShort = formatDateShort(part, locale);
    return dateShort ? `${dayLabel} ${dateShort}` : dayLabel;
  }
  return formatDateShort(dateStr, locale);
}

export function formatBookingEmployeeNearestLine(
  dateStr: string,
  time: string,
  nearestLabel: string,
  locale: 'cs' | 'en' = 'cs'
): string {
  const day = formatBookingEmployeeNearestDayLabel(dateStr, locale);
  const trimmedTime = time.trim();
  if (!day && !trimmedTime) return nearestLabel;
  if (!day) return `${nearestLabel} · ${trimmedTime}`;
  if (!trimmedTime) return `${nearestLabel} ${day}`;
  return `${nearestLabel} ${day} · ${trimmedTime}`;
}

export function branchImageUrl(branch: BookingEntity): string | null {
  const url = branch.imageUrl ?? branch.avatarUrl;
  return typeof url === 'string' && url.trim() ? url.trim() : null;
}
