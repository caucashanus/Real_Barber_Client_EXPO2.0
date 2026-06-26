import type { Booking } from '@/api/bookings';

import { getBookingStartDate, isBookingPast } from '@/utils/bookingHelpers';

const DAY_MS = 24 * 60 * 60 * 1000;

export type HaircutVisitStatus = 'ok' | 'approaching' | 'overdue';

export interface HaircutVisitPoint {
  booking: Booking;
  date: Date;
}

export interface HaircutVisitStats {
  visits: HaircutVisitPoint[];
  intervals: number[];
  intervalLabels: string[];
  averageInterval: number | null;
  longestPause: number | null;
  daysSinceLastVisit: number | null;
  /** Kladné = doporučeno za N dní; ≤ 0 = už je čas / po termínu. */
  recommendedInDays: number | null;
  status: HaircutVisitStatus;
  hasEnoughData: boolean;
}

export function daysBetweenDates(from: Date, to: Date): number {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.max(0, Math.round((toDay - fromDay) / DAY_MS));
}

export function visitStatusFromDaysSince(days: number): HaircutVisitStatus {
  if (days > 40) return 'overdue';
  if (days > 30) return 'approaching';
  return 'ok';
}

export function formatVisitDate(date: Date, locale: string): string {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return date.toLocaleDateString(tag, { day: 'numeric', month: 'long' });
}

export function computeHaircutVisitStats(
  bookings: Booking[],
  nowMs: number = Date.now()
): HaircutVisitStats {
  const visits: HaircutVisitPoint[] = bookings
    .filter((b) => isBookingPast(b))
    .map((booking) => ({ booking, date: getBookingStartDate(booking) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const intervals: number[] = [];
  const intervalLabels: string[] = [];

  for (let i = 1; i < visits.length; i++) {
    intervals.push(daysBetweenDates(visits[i - 1].date, visits[i].date));
    intervalLabels.push(`${i}→${i + 1}`);
  }

  const hasEnoughData = visits.length >= 2;
  const averageInterval =
    intervals.length > 0
      ? Math.round(intervals.reduce((sum, n) => sum + n, 0) / intervals.length)
      : null;
  const longestPause = intervals.length > 0 ? Math.max(...intervals) : null;

  const lastVisit = visits.length > 0 ? visits[visits.length - 1].date : null;
  const daysSinceLastVisit = lastVisit ? daysBetweenDates(lastVisit, new Date(nowMs)) : null;

  let recommendedInDays: number | null = null;
  if (averageInterval != null && daysSinceLastVisit != null) {
    recommendedInDays = averageInterval - daysSinceLastVisit;
  }

  const status =
    daysSinceLastVisit != null ? visitStatusFromDaysSince(daysSinceLastVisit) : 'ok';

  return {
    visits,
    intervals,
    intervalLabels,
    averageInterval,
    longestPause,
    daysSinceLastVisit,
    recommendedInDays,
    status,
    hasEnoughData,
  };
}
