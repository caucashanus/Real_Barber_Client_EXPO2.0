import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';
import { formatVisitPlanDayMonthCompact } from '@/utils/visitPlanDates';

export function formatVisitPlanBookingWhenLine(
  booking: VisitPlanPastBooking,
  locale: string
): string {
  const dateLabel = formatVisitPlanDayMonthCompact(booking.dateIso, locale);
  const time = booking.time.trim();
  if (dateLabel && time && time !== '—') {
    return `${dateLabel} v ${time}`;
  }
  return dateLabel || '';
}

export function formatVisitPlanBookingMetaLine(booking: VisitPlanPastBooking): string {
  return [booking.employeeName.trim(), booking.branchLabel?.trim()]
    .filter(Boolean)
    .join(' · ');
}

export function formatVisitPlanBookedBannerSubtitle(
  booking: VisitPlanPastBooking,
  locale: string
): string {
  const when = formatVisitPlanBookingWhenLine(booking, locale);
  const service = booking.serviceLabel?.trim();
  const branch = booking.branchLabel?.trim();
  const tail = [branch, service].filter(Boolean).join(' · ');
  return [when, tail].filter(Boolean).join(' · ');
}
