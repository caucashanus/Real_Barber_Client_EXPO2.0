import type { Booking } from '@/api/bookings';
import { Alert, Linking } from 'react-native';

import { getBookingEndDate, getBookingStartDate } from '@/utils/bookingHelpers';

/** Začátek a konec události v lokálním čase zařízení (kalendářní den z `date`, časy ze slotů). */
export function getBookingCalendarTimeRange(booking: Booking): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = getBookingStartDate(booking);
  let endDate = getBookingEndDate(booking);
  if (endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startDate, endDate };
}

export function getBookingCalendarTitle(booking: Booking): string {
  const service = (booking.item?.name ?? '').trim() || 'Real Barber';
  const branch = (booking.branch?.name ?? '').trim();
  const core = branch ? `${service} — ${branch}` : service;
  return `Real Barber - ${core}`;
}

export function getBookingCalendarLocation(booking: Booking): string {
  return (booking.branch?.address ?? booking.branch?.name ?? '').trim();
}

export interface BookingCalendarActionStrings {
  noteBarberPrefix: string;
  reservationNumberPrefix: string;
  errorTitle: string;
  errorMessage: string;
}

/** Nativní dialog kalendáře, jinak Google Calendar v prohlížeči. */
export async function addBookingToCalendar(
  booking: Booking,
  strings: BookingCalendarActionStrings
): Promise<void> {
  const { startDate, endDate } = getBookingCalendarTimeRange(booking);
  const title = getBookingCalendarTitle(booking);
  const loc = getBookingCalendarLocation(booking);
  const noteLines: string[] = [];
  if (booking.employee?.name) {
    noteLines.push(`${strings.noteBarberPrefix}: ${booking.employee.name}`);
  }
  noteLines.push(`${strings.reservationNumberPrefix}: #${booking.id.slice(0, 8)}`);
  const notes = noteLines.join('\n');

  let calendarMod: typeof import('expo-calendar') | undefined;
  try {
    calendarMod = await import('expo-calendar');
  } catch {
    calendarMod = undefined;
  }

  if (calendarMod) {
    try {
      await calendarMod.createEventInCalendarAsync({
        title,
        startDate,
        endDate,
        location: loc || undefined,
        notes,
        alarms: [{ relativeOffset: -60 }],
      });
      return;
    } catch {
      Alert.alert(strings.errorTitle, strings.errorMessage);
      return;
    }
  }

  try {
    const url = buildGoogleCalendarTemplateUrl({
      title,
      startDate,
      endDate,
      details: notes,
      location: loc,
    });
    await Linking.openURL(url);
  } catch {
    Alert.alert(strings.errorTitle, strings.errorMessage);
  }
}

/** Záloha bez nativního `expo-calendar` — otevře přidání události v Google Kalendáři v prohlížeči. */
export function buildGoogleCalendarTemplateUrl(opts: {
  title: string;
  startDate: Date;
  endDate: Date;
  details: string;
  location: string;
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const utcCompact = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const dates = `${utcCompact(opts.startDate)}/${utcCompact(opts.endDate)}`;
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates,
    details: opts.details,
    location: opts.location,
  }).toString()}`;
}
