import type { Booking } from '@/api/bookings';
import type { Branch } from '@/api/branches';
import { getBranchServicesList, getMediaUrlsSorted } from '@/utils/branchMediaHelpers';

export const BRANCH_IMAGES: Record<string, number> = {
  Modřany: require('@/assets/img/branches/Modrany.jpg'),
  Kačerov: require('@/assets/img/branches/Kacerov.jpg'),
  Hagibor: require('@/assets/img/branches/Hagibor.jpg'),
  Barrandov: require('@/assets/img/branches/Barrandov.jpg'),
};

/** Same image list as branch-detail: media, imageUrl, service images; fallback to local BRANCH_IMAGES. */
export function branchImages(branch: Branch): (string | number)[] {
  const out: (string | number)[] = [];
  const mediaUrls = getMediaUrlsSorted(branch.media);
  mediaUrls.forEach((url) => out.push(url));
  if (branch.imageUrl) out.push(branch.imageUrl);
  const servicesList = getBranchServicesList(branch);
  servicesList.forEach((svc) => {
    if (svc.imageUrl) out.push(svc.imageUrl);
  });
  if (out.length === 0 && branch.name && BRANCH_IMAGES[branch.name] != null) {
    out.push(BRANCH_IMAGES[branch.name]);
  }
  if (out.length === 0) out.push(require('@/assets/img/branches/Modrany.jpg'));
  return out;
}

export function formatAppointment(
  b: Booking,
  _dateLocale: string
): { dateStr: string; fromTime: string; toTime: string } {
  const raw = (b.date || '').slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  const dateStr =
    Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
      ? `${d}. ${m}. ${y}`
      : (() => {
          const dt = new Date(b.date);
          return `${dt.getDate()}. ${dt.getMonth() + 1}. ${dt.getFullYear()}`;
        })();
  return {
    dateStr,
    fromTime: b.slotStart,
    toTime: b.slotEnd,
  };
}

/** Krátké datum pro recenzi rezervace — např. „19. 7.“ */
export function formatReservationReviewDateLabel(isoDate: string): string {
  const [, m, d] = (isoDate ?? '').slice(0, 10).split('-');
  if (!m || !d) return '';
  return `${Number(d)}. ${Number(m)}.`;
}

/** Subtitle pod „Recenzujete rezervaci“ — např. „19. 7. v 12:00 Kačerov“. */
export function formatReservationReviewSubtitle(
  dateLabel: string,
  slotStart: string,
  branchName: string
): string {
  const when =
    dateLabel && slotStart ? `${dateLabel} v ${slotStart}` : dateLabel || slotStart;
  return [when, branchName.trim()].filter(Boolean).join(' ');
}

/** Query parametry entityDate/Time/Branch pro /screens/review u rezervace. */
export function buildReservationReviewContextQuery(booking: Booking): string {
  const dateLabel = formatReservationReviewDateLabel(booking.date ?? '');
  const dateParam = dateLabel ? `&entityDate=${encodeURIComponent(dateLabel)}` : '';
  const timeParam = booking.slotStart
    ? `&entityTime=${encodeURIComponent(booking.slotStart)}`
    : '';
  const branchParam = booking.branch?.name
    ? `&entityBranch=${encodeURIComponent(booking.branch.name)}`
    : '';
  return `${dateParam}${timeParam}${branchParam}`;
}

/** Datum a čas jen pro text ve sheetu zrušení (CS: „29. 5 v 16:45“ z kalendářního data rezervace). */
export function formatCancelSheetWhen(b: Booking, locale: string): string {
  const time = (b.slotStart || '').trim();
  const raw = (b.date || '').slice(0, 10);
  const nums = raw.split('-').map(Number);
  const y = nums[0];
  const m = nums[1];
  const d = nums[2];
  if (locale === 'cs' && Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    return `${d}. ${m} v ${time}`;
  }
  const dt = new Date(b.date);
  const monthShort = dt.toLocaleString('en-GB', { month: 'short' });
  return `${dt.getDate()} ${monthShort} ${dt.getFullYear()} at ${time}`;
}
