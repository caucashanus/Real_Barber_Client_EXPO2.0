import type { Booking } from '@/api/bookings';
import {
  isBookingCurrent,
  isBookingUpcoming,
} from '@/utils/bookingHelpers';
import { intlLocaleTag } from '@/utils/intlLocaleTag';

export function formatBookingListDate(b: Booking, locale: string = 'en'): string {
  const d = new Date(b.date);
  const dateLocale = intlLocaleTag(locale);
  const day = d.getDate();
  const month = d.toLocaleString(dateLocale, { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}, ${b.slotStart}`;
}

export type BookingCountdownParts =
  | { type: 'days'; days: number }
  | { type: 'hours'; hours: number; minutes: number }
  | { type: 'minutes'; minutes: number; seconds: number };

export function getBookingCountdownParts(target: Date): BookingCountdownParts | null {
  const now = Date.now();
  const ms = target.getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  if (!Number.isFinite(totalMinutes)) return null;
  if (days >= 3) return { type: 'days', days };
  if (totalHours >= 1) return { type: 'hours', hours: totalHours, minutes: totalMinutes % 60 };
  const totalSeconds = Math.floor(ms / 1000);
  return { type: 'minutes', minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

export function groupBookingsByYear(
  bookings: Booking[],
  options?: { upcomingFirst?: boolean }
): Record<string, Booking[]> {
  const byYear: Record<string, Booking[]> = {};
  const sorted = [...bookings].sort((a, b) => {
    const aCurrent = isBookingCurrent(a);
    const bCurrent = isBookingCurrent(b);
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
    if (options?.upcomingFirst) {
      const aUp = isBookingUpcoming(a);
      const bUp = isBookingUpcoming(b);
      if (aUp !== bUp) return aUp ? -1 : 1;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  for (const b of sorted) {
    const year = String(new Date(b.date).getFullYear());
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(b);
  }
  return byYear;
}

export function sortBookingYearsDesc(years: string[]): string[] {
  return [...years].sort((a, b) => Number(b) - Number(a));
}