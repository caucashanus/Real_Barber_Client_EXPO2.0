import type { Booking } from '@/api/bookings';
import { intlLocaleTag } from '@/utils/intlLocaleTag';

/** Řádek meta u kroku PIN: `{datum a čas} · {pobočka}`. */
export function formatKidsWatchBookingDateBranch(booking: Booking, locale: string): string {
  const d = new Date(booking.date);
  const dateLocale = intlLocaleTag(locale);
  let dateTime: string;
  if (Number.isNaN(d.getTime())) {
    dateTime = `${(booking.date || '').slice(0, 10)}, ${booking.slotStart}`;
  } else {
    const day = d.getDate();
    const month = d.toLocaleString(dateLocale, { month: 'short' });
    const year = d.getFullYear();
    dateTime = `${day} ${month} ${year}, ${booking.slotStart}`;
  }
  const branch = booking.branch?.name?.trim();
  return branch ? `${dateTime} · ${branch}` : dateTime;
}
