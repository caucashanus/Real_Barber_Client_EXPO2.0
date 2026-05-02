import type { Booking } from '@/api/bookings';

function isNotCancelled(booking: Booking): boolean {
  const status = (booking.status ?? '').toLowerCase();
  return status !== 'cancelled' && status !== 'canceled';
}

export function isBookingNotCancelled(booking: Booking): boolean {
  return isNotCancelled(booking);
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Normalizované hodnoty statusu = hotová návštěva (klient API ne vždy posílá jen `completed`). */
const COMPLETED_STATUS_NORMALIZED = new Set([
  'completed',
  'complete',
  'done',
  'finished',
  'closed',
  'paid',
  'settled',
  'ukonceno',
  'dokonceno',
  'vyrizeno',
  'zaplaceno',
]);

function normalizeStatusToken(booking: Booking): string {
  return stripDiacritics(
    String(booking.status ?? '')
      .trim()
      .toLowerCase()
  )
    .replace(/_/g, '')
    .replace(/\s+/g, '');
}

function hasRecordedPayment(booking: Booking): boolean {
  const pm = String(booking.paymentMethod ?? '').trim();
  if (pm !== '') return true;
  const payments = booking.payments;
  if (!Array.isArray(payments) || payments.length === 0) return false;
  return payments.some((p) => {
    if (p == null || typeof p !== 'object') return false;
    const m = String((p as { method?: string }).method ?? '').trim();
    const amt = (p as { amount?: number | null }).amount;
    return m !== '' || (typeof amt === 'number' && amt > 0);
  });
}

/**
 * Dokončená návštěva pro UI — přednost před „probíhá“ podle času slotu.
 * Zohledňuje synonyma statusu, případně zapsanou platbu (po uzavření u pokladny).
 */
export function isBookingMarkedCompleted(booking: Booking): boolean {
  const raw = String(booking.status ?? '')
    .trim()
    .toLowerCase();
  const compact = normalizeStatusToken(booking);

  if (compact && COMPLETED_STATUS_NORMALIZED.has(compact)) return true;
  // např. completed_payment, complete_at_pickup
  if (compact.startsWith('complet')) return true;

  const deaccent = stripDiacritics(raw);
  if (/dokonc|ukonc|vyrizen|zaplacen/.test(deaccent)) return true;

  if (hasRecordedPayment(booking)) return true;

  return false;
}

export function getBookingStartDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

export function getBookingEndDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

/** @deprecated Use getBookingStartDate */
export const getTargetDate = getBookingStartDate;

/** Rezervace probíhá v daném okamžiku (slot podle data/času, ne zrušená, ne dokončená). */
export function isBookingDuringSlotAt(booking: Booking, atMs: number): boolean {
  if (!isNotCancelled(booking)) return false;
  if (isBookingMarkedCompleted(booking)) return false;
  const start = getBookingStartDate(booking).getTime();
  const end = getBookingEndDate(booking).getTime();
  return start <= atMs && end >= atMs;
}

/** Začátek rezervace je až po `atMs` (ne zrušená, ne dokončená). */
export function isBookingFutureStartAt(booking: Booking, atMs: number): boolean {
  if (!isNotCancelled(booking)) return false;
  if (isBookingMarkedCompleted(booking)) return false;
  return getBookingStartDate(booking).getTime() > atMs;
}

export function isBookingUpcoming(booking: Booking): boolean {
  return isBookingFutureStartAt(booking, Date.now());
}

export function isBookingCurrent(booking: Booking): boolean {
  return isBookingDuringSlotAt(booking, Date.now());
}

export function isBookingPast(booking: Booking): boolean {
  if (!isNotCancelled(booking)) return false;
  if (isBookingMarkedCompleted(booking)) return true;
  return getBookingEndDate(booking).getTime() < Date.now();
}

export type BookingUiStatusTranslationKey =
  | 'bookingStatusCancelled'
  | 'bookingStatusInProgress'
  | 'bookingStatusPast'
  | 'bookingStatusUpcoming';

/**
 * Stav pro UI (stejná logika jako karty v Rezervace / patička detailu).
 * Nepoužívá surový `booking.status` z API — ten může být anglicky (scheduled, …).
 */
export function getBookingUiStatusTranslationKey(booking: Booking): BookingUiStatusTranslationKey {
  const status = (booking.status ?? '').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'canceled';
  if (isCancelled) return 'bookingStatusCancelled';
  if (isBookingMarkedCompleted(booking)) return 'bookingStatusPast';
  if (isBookingCurrent(booking)) return 'bookingStatusInProgress';
  if (isBookingPast(booking)) return 'bookingStatusPast';
  return 'bookingStatusUpcoming';
}
