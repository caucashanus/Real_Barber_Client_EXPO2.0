import type { Booking } from '@/api/bookings';
import {
  getBookingEndDate,
  getBookingStartDate,
  isBookingDuringSlotAt,
  isBookingFutureStartAt,
} from '@/utils/bookingHelpers';
import { formatRelativeDayLabel } from '@/utils/formatRelativeDayLabel';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

type WidgetTimelineEntryLocal<T extends object> = {
  date: Date;
  props: T;
};

export type RealBarberBookingWidgetProps = {
  hasBooking: boolean;
  branchName?: string;
  employeeName?: string;
  serviceName?: string;
  dateLabel?: string;
  timeLabel?: string;
  isInProgress?: boolean;
  lockScreenLine?: string;
  deepLinkUrl?: string;
};

export const EMPTY_WIDGET_BOOKING_PROPS: RealBarberBookingWidgetProps = {
  hasBooking: false,
  lockScreenLine: 'Real Barber',
  deepLinkUrl: 'realbarber://',
};

function buildWidgetDeepLink(reservationId: string): string {
  return `realbarber://screens/booking-detail?id=${encodeURIComponent(reservationId)}`;
}

/** Nejbližší probíhající nebo budoucí rezervace pro widget. */
export function pickNextWidgetBooking(
  bookings: Booking[],
  nowMs: number = Date.now()
): Booking | null {
  const active = bookings.find((booking) => isBookingDuringSlotAt(booking, nowMs));
  if (active) return active;

  const upcoming = bookings
    .filter((booking) => isBookingFutureStartAt(booking, nowMs))
    .sort(
      (a, b) => getBookingStartDate(a).getTime() - getBookingStartDate(b).getTime()
    );

  return upcoming[0] ?? null;
}

export function buildWidgetBookingProps(
  booking: Booking,
  atMs: number = Date.now()
): RealBarberBookingWidgetProps {
  const todayIso = getPragueTodayDateString();
  const dateLabel = formatRelativeDayLabel({
    dayIso: booking.date,
    todayIso,
    locale: 'cs',
    variant: 'titleTab',
  });
  const timeLabel = formatNextSlotDisplayTime(booking.slotStart);
  const branchName = booking.branch?.name?.trim() ?? '';
  const weekdayShort = dateLabel.split(' ')[0] ?? dateLabel;

  return {
    hasBooking: true,
    branchName,
    employeeName: booking.employee?.name?.trim() ?? '',
    serviceName: booking.item?.name?.trim() ?? '',
    dateLabel,
    timeLabel,
    isInProgress: isBookingDuringSlotAt(booking, atMs),
    lockScreenLine: `Real Barber · ${weekdayShort} ${timeLabel} · ${branchName}`,
    deepLinkUrl: buildWidgetDeepLink(booking.id),
  };
}

export function buildWidgetBookingTimeline(
  booking: Booking,
  nowMs: number = Date.now()
): WidgetTimelineEntryLocal<RealBarberBookingWidgetProps>[] {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  const entries: WidgetTimelineEntryLocal<RealBarberBookingWidgetProps>[] = [
    { date: new Date(nowMs), props: buildWidgetBookingProps(booking, nowMs) },
  ];

  if (startMs > nowMs + 60_000) {
    entries.push({
      date: new Date(startMs),
      props: buildWidgetBookingProps(booking, startMs),
    });
  }

  entries.push({
    date: new Date(endMs + 60_000),
    props: EMPTY_WIDGET_BOOKING_PROPS,
  });

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}
