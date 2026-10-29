import type { Booking, BookingManageLifecycle } from '@/api/bookings';
import {
  getBookingEndDate,
  isBookingCancelledStatus,
  isBookingDuringSlotAt,
  isBookingMarkedCompleted,
  isBookingNoShow,
} from '@/utils/bookingHelpers';

export type BookingManageAction = 'confirm' | 'reschedule' | 'cancel';

export type { BookingManageLifecycle } from '@/api/bookings';
export type { BookingManage } from '@/api/bookings';

const TERMINAL_LIFECYCLES = new Set<BookingManageLifecycle>([
  'cancelled',
  'completed',
  'no_show',
  'expired',
]);

export function bookingHasManageActions(booking: Booking): boolean {
  return Array.isArray(booking.manage?.allowedActions);
}

export function bookingManageAllows(
  booking: Booking,
  action: BookingManageAction
): boolean {
  return booking.manage?.allowedActions?.includes(action) ?? false;
}

export function confirmPromptAllowedByTime(booking: Booking, nowMs: number): boolean {
  const ui = getClientBookingUiStatus(booking, nowMs);
  if (ui === 'no_show' || ui === 'cancelled') return false;

  const lifecycle = booking.manage?.lifecycle;
  if (lifecycle && TERMINAL_LIFECYCLES.has(lifecycle)) return false;

  if (isBookingDuringSlotAt(booking, nowMs)) return false;
  if (nowMs > getBookingEndDate(booking).getTime()) return false;

  return true;
}

export function showBookingConfirmPrompt(booking: Booking, nowMs: number): boolean {
  if (!bookingManageAllows(booking, 'confirm')) return false;
  return confirmPromptAllowedByTime(booking, nowMs);
}

export function clientBookingManageLifecycleIsConfirmed(booking: Booking): boolean {
  return booking.manage?.lifecycle === 'confirmed';
}

export function bookingManageMessage(booking: Booking): string | null {
  const message = booking.manage?.message?.trim();
  return message || null;
}

/** CRM `manage.message` — jen když je confirm CTA viditelné (parita web). */
export function bookingDetailManageMessage(booking: Booking, nowMs: number): string | null {
  if (!showBookingConfirmPrompt(booking, nowMs)) return null;
  return bookingManageMessage(booking);
}

export type ClientBookingUiStatus =
  | 'no_show'
  | 'cancelled'
  | 'past'
  | 'inProgress'
  | 'upcoming';

export function bookingFooterShowReschedule(
  booking: Booking,
  uiStatus: ClientBookingUiStatus
): boolean {
  if (uiStatus !== 'upcoming') return false;
  return bookingHasManageActions(booking)
    ? bookingManageAllows(booking, 'reschedule')
    : true;
}

export function bookingFooterShowCancel(
  booking: Booking,
  uiStatus: ClientBookingUiStatus
): boolean {
  if (uiStatus !== 'upcoming') return false;
  return bookingHasManageActions(booking)
    ? bookingManageAllows(booking, 'cancel')
    : true;
}

export function getClientBookingUiStatus(
  booking: Booking,
  nowMs: number = Date.now()
): ClientBookingUiStatus {
  if (isBookingNoShow(booking) || booking.manage?.lifecycle === 'no_show') {
    return 'no_show';
  }
  if (isBookingCancelledStatus(booking) || booking.manage?.lifecycle === 'cancelled') {
    return 'cancelled';
  }
  if (isBookingDuringSlotAt(booking, nowMs)) return 'inProgress';

  const endMs = getBookingEndDate(booking).getTime();
  if (isBookingMarkedCompleted(booking) || endMs < nowMs) return 'past';

  return 'upcoming';
}
