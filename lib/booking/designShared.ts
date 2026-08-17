import type { Locale } from '@/contexts/LanguageContext';
import type { BookingEntity, BookingService } from '@/lib/booking/constants';
import { formatRelativeDayLabel } from '@/utils/formatRelativeDayLabel';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

export function formatBookingServicePriceLabel(
  service: BookingService | null | undefined,
  fromPriceLabel: string,
  currencySuffix: string
): string | undefined {
  const pricing = service?.pricing;
  const amount = pricing?.minPrice;
  if (amount == null || amount <= 0) return undefined;
  if (pricing.kind === 'exact') {
    return `${amount} ${currencySuffix}`;
  }
  return `${fromPriceLabel} ${amount} ${currencySuffix}`;
}

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

export function formatNearestTermLabel(dateStr: string, locale: Locale = 'cs'): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  return formatRelativeDayLabel({
    dayIso: dateStr,
    todayIso: getPragueTodayDateString(),
    locale,
    variant: 'when',
  });
}

/** Relative day label for booking employee list — lowercase in sentence (zítra · 14:30). */
export function formatBookingEmployeeNearestDayLabel(
  dateStr: string,
  locale: Locale = 'cs'
): string {
  return formatNearestTermLabel(dateStr, locale);
}

export function formatBookingEmployeeNearestLine(
  dateStr: string,
  time: string,
  nearestLabel: string,
  locale: Locale = 'cs'
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
