import type { BookingRecipeId, BookingStepKind } from '@/lib/booking/engine/types';

/** Klientský zdroj monitoringu — web vs mobilní app. */
export type BookingMonitorSource = 'web' | 'app';

export type BookingMonitorEntry =
  | 'nearest-slot'
  | 'repeat'
  | 'spotlight'
  | 'deep-link'
  | 'branch-first'
  | 'employee-profile'
  | 'service-detail'
  | 'unknown';

export const BOOKING_MONITOR_EVENTS = [
  'session_started',
  'selected_branch',
  'selected_service',
  'selected_employee',
  'selected_date',
  'selected_slot',
  'entered_contact',
  'entered_summary',
  'opened_discount_code',
  'opened_gift_voucher',
  'coupon_verified',
  'coupon_invalid',
  'coupon_applied',
  'otp_sent',
  'otp_success',
  'invalid_otp',
  'cancel_phone',
  'left_page',
  'reservation_no_otp',
  'reservation_success',
] as const;

export type BookingMonitorEvent = (typeof BOOKING_MONITOR_EVENTS)[number];

export type BookingMonitorPayload = {
  event: BookingMonitorEvent;
  source: BookingMonitorSource;
  sessionId: string;
  entry: BookingMonitorEntry;
  recipeId?: string | null;
  step?: BookingStepKind | string | null;
  locale?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  isNewClient?: boolean | null;
  isLoggedIn?: boolean | null;
  clientName?: string | null;
  phoneMasked?: string | null;
  branchName?: string | null;
  serviceName?: string | null;
  employeeName?: string | null;
  date?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
};

export type TrackBookingMonitorFields = {
  recipeId?: BookingRecipeId | string | null;
  step?: BookingStepKind | string | null;
  locale?: string | null;
  isNewClient?: boolean | null;
  branchName?: string | null;
  serviceName?: string | null;
  employeeName?: string | null;
  date?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  /** Best-effort odchod — prefer background fetch. */
  background?: boolean;
};
