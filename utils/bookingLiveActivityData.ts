import type { Booking } from '@/api/bookings';
import {
  getBookingClientReviewRating,
  getBookingEndDate,
  getBookingStartDate,
  isBookingDuringSlotAt,
  isBookingFutureStartAt,
  isBookingNotCancelled,
} from '@/utils/bookingHelpers';
import {
  BOOKING_LA_START_MS,
  BOOKING_REVIEW_LINGER_MS,
  BOOKING_REVIEW_STAGE,
  BOOKING_STAGE_COUNT,
  BOOKING_STAGE_OFFSETS_MIN,
  BOOKING_STAGE_START_GRACE_MS,
  formatBookingStageTitle,
  getBookingStageConfig,
  getBookingStageOffsetMs,
  type BookingActivityStageKind,
} from '@/utils/bookingLiveActivityStages';
import { getHomeSpotlightReviewQueryString } from '@/utils/homeSpotlight';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';
import { pickNextWidgetBooking } from '@/utils/widgetBookingData';

export {
  BOOKING_LA_START_MS,
  BOOKING_REVIEW_LINGER_MS,
  BOOKING_REVIEW_STAGE,
  BOOKING_SOON_MS,
  BOOKING_STAGE_COUNT,
} from '@/utils/bookingLiveActivityStages';

/** @deprecated Použij BOOKING_STAGE_CONFIG — zachováno pro testy / CRM payload parity. */
export const BOOKING_STAGE_LABELS = [
  'Počítáme s vámi',
  'Brzy začínáme',
  'Kdo se o vás dnes postará?',
  'Podívejte se na katalog účesů',
  'Za chvíli se vám budeme věnovat',
  'Právě začínáme',
  'Probíhá',
  'Ohodnoťte',
] as const;

export type BookingActivityProps = {
  bookingId: string;
  status: string;
  stage: number;
  stageKind?: BookingActivityStageKind;
  nowEpochMs: number;
  /** Začátek LA okna (T−90). */
  soonEpochMs: number;
  appointmentEpochMs: number;
  endEpochMs: number;
  branchName?: string;
  employeeName?: string;
  serviceName?: string;
  durationMinutes?: number;
  timeLabel?: string;
  logoUri?: string;
  existingReviewRating?: number;
  subtitle?: string;
  /** Delší copy pro expanded Dynamic Island — jinak se použije subtitle. */
  expandedSubtitle?: string;
  ctaLabel?: string;
  ctaKind?: 'none' | 'countdown' | 'navigate' | 'inspire' | 'duration';
  progressPhase?: 0 | 1 | 2;
  /** Countdown zobrazení bez sekund — widget formát „1h 15m“. */
  countdownHours?: number;
  countdownMinutes?: number;
  /** Tap target — lock screen banner uses widgetURL(props); Dynamic Island uses start(url). */
  deepLinkUrl?: string;
};

export function formatBookingCountdownHm(
  appointmentMs: number,
  nowMs: number = Date.now()
): { hours: number; minutes: number } {
  const remainingMs = Math.max(0, appointmentMs - nowMs);
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

function buildBookingDeepLink(reservationId: string): string {
  return `realbarber://screens/booking-detail?id=${encodeURIComponent(reservationId)}`;
}

function buildInspiraceDeepLink(): string {
  return 'realbarber://inspirace';
}

function buildBookingNavigateDeepLink(reservationId: string): string {
  return `realbarber://screens/booking-detail?id=${encodeURIComponent(reservationId)}&openNavigate=1`;
}

export function formatBookingStage2Subtitle(employeeName?: string): string {
  const name = employeeName?.trim() || 'Váš barber';
  return `${name} se o vás dnes postará · klepněte pro detail.`;
}

export function formatBookingStage3Subtitle(): string {
  return 'Klepněte pro zobrazení';
}

export function formatBookingStage3ExpandedSubtitle(): string {
  return 'Klepněte pro zobrazení katalogu účesů';
}

function getBookingActivityStageKind(booking: Booking): BookingActivityStageKind {
  const status = (booking.status ?? '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status.includes('resched')) return 'rescheduled';
  return 'normal';
}

export function isBookingLiveActivityReviewEligible(
  booking: Booking,
  nowMs: number = Date.now()
): boolean {
  if (!isBookingNotCancelled(booking)) return false;
  if (getBookingClientReviewRating(booking) != null) return false;
  const endMs = getBookingEndDate(booking).getTime();
  if (nowMs < endMs) return false;
  return nowMs <= endMs + BOOKING_REVIEW_LINGER_MS;
}

export function computeBookingActivityStage(booking: Booking, nowMs: number = Date.now()): number {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();

  if (nowMs >= endMs) return BOOKING_REVIEW_STAGE;
  if (nowMs >= startMs + BOOKING_STAGE_START_GRACE_MS) return 6;
  if (nowMs >= startMs) return 5;

  for (let i = BOOKING_STAGE_OFFSETS_MIN.length - 2; i >= 0; i -= 1) {
    const thresholdMs = startMs - getBookingStageOffsetMs(i);
    if (nowMs >= thresholdMs) return i;
  }

  return 0;
}

export function shouldTrackBookingLiveActivity(
  booking: Booking,
  nowMs: number = Date.now()
): boolean {
  const startMs = getBookingStartDate(booking).getTime();
  const laStartMs = startMs - BOOKING_LA_START_MS;
  if (nowMs < laStartMs) return false;

  return (
    isBookingFutureStartAt(booking, nowMs) ||
    isBookingDuringSlotAt(booking, nowMs) ||
    isBookingLiveActivityReviewEligible(booking, nowMs)
  );
}

export function pickBookingLiveActivityBooking(
  bookings: Booking[],
  nowMs: number = Date.now()
): Booking | null {
  const next = pickNextWidgetBooking(bookings, nowMs);
  if (next && shouldTrackBookingLiveActivity(next, nowMs)) return next;

  const reviewCandidate = bookings
    .filter((booking) => isBookingLiveActivityReviewEligible(booking, nowMs))
    .sort((a, b) => getBookingEndDate(b).getTime() - getBookingEndDate(a).getTime())[0];

  return reviewCandidate ?? null;
}

export function buildBookingActivityDeepLink(booking: Booking): string {
  return buildBookingDeepLink(booking.id);
}

export function buildBookingActivityReviewDeepLink(booking: Booking): string {
  return `realbarber://screens/review?${getHomeSpotlightReviewQueryString(booking)}`;
}

export function buildBookingActivityDeepLinkForStage(booking: Booking, stage: number): string {
  if (stage >= BOOKING_REVIEW_STAGE) return buildBookingActivityReviewDeepLink(booking);
  if (stage === 1) {
    return buildBookingNavigateDeepLink(booking.id);
  }
  if (stage === 3) return buildInspiraceDeepLink();
  return buildBookingActivityDeepLink(booking);
}

export function getBookingActivityStageTimes(booking: Booking): number[] {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  const thresholds = BOOKING_STAGE_OFFSETS_MIN.map((minutes) => startMs - minutes * 60 * 1000);
  return [
    ...thresholds,
    startMs + BOOKING_STAGE_START_GRACE_MS,
    endMs,
    endMs + BOOKING_REVIEW_LINGER_MS,
  ];
}

export function getBookingActivityReviewDismissDelayMs(
  booking: Booking,
  nowMs: number = Date.now()
): number {
  const dismissAt = getBookingEndDate(booking).getTime() + BOOKING_REVIEW_LINGER_MS;
  return Math.max(0, dismissAt - nowMs);
}

/** Pro preview / ladění UI — vrátí `nowMs` uprostřed daného stage. */
export function previewNowMsForStage(booking: Booking, stage: number): number {
  const startMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  const mid = (a: number, b: number) => a + Math.floor((b - a) / 2);

  if (stage >= BOOKING_REVIEW_STAGE) return endMs + 5 * 60 * 1000;
  if (stage === 6) return mid(startMs + BOOKING_STAGE_START_GRACE_MS, endMs);
  if (stage === 5) return mid(startMs, startMs + BOOKING_STAGE_START_GRACE_MS);

  const nextThreshold =
    stage < BOOKING_STAGE_OFFSETS_MIN.length - 1
      ? startMs - getBookingStageOffsetMs(stage + 1)
      : startMs;
  const currentThreshold = startMs - getBookingStageOffsetMs(stage);
  return mid(currentThreshold, nextThreshold);
}

export function buildBookingActivityProps(
  booking: Booking,
  logoUri: string | null,
  nowMs: number = Date.now(),
  options?: {
    forcedStage?: number;
    stageKind?: BookingActivityStageKind;
    /** Pevný začátek LA okna — jako startEpochMs v expo delivery example. */
    laStartEpochMs?: number;
  }
): BookingActivityProps {
  const appointmentMs = getBookingStartDate(booking).getTime();
  const endMs = getBookingEndDate(booking).getTime();
  const soonMs = options?.laStartEpochMs ?? appointmentMs - BOOKING_LA_START_MS;
  const stage = options?.forcedStage ?? computeBookingActivityStage(booking, nowMs);
  const stageKind = options?.stageKind ?? getBookingActivityStageKind(booking);
  const stageConfig = getBookingStageConfig(stage);
  const existingReviewRating = getBookingClientReviewRating(booking);

  const branchName = booking.branch?.name?.trim() ?? '';
  const employeeName = booking.employee?.name?.trim() ?? '';
  const serviceName = booking.item?.name?.trim() ?? '';
  const timeLabel = formatNextSlotDisplayTime(booking.slotStart);
  const durationMinutes =
    typeof booking.duration === 'number' && booking.duration > 0 ? booking.duration : undefined;

  const status =
    stageKind === 'normal'
      ? formatBookingStageTitle(stageConfig, employeeName, serviceName)
      : stageKind === 'cancelled'
        ? 'Rezervace zrušena'
        : 'Termín změněn';

  const subtitleParts = [branchName, employeeName, timeLabel].filter(Boolean);
  const subtitle =
    stageKind === 'normal'
      ? stage === 2
        ? formatBookingStage2Subtitle(employeeName)
        : stage === 3
          ? formatBookingStage3Subtitle()
          : stage === 6 && durationMinutes
          ? `cca ${durationMinutes} min · ${subtitleParts.join(' · ')}`
          : subtitleParts.join(' · ')
      : stageKind === 'cancelled'
        ? 'Termín byl zrušen'
        : 'Otevřete detail rezervace';

  const countdown =
    stageKind === 'normal' && stageConfig.ctaKind === 'countdown'
      ? formatBookingCountdownHm(appointmentMs, nowMs)
      : undefined;

  return {
    bookingId: booking.id,
    status,
    stage,
    stageKind,
    nowEpochMs: nowMs,
    soonEpochMs: soonMs,
    appointmentEpochMs: appointmentMs,
    endEpochMs: endMs,
    branchName,
    employeeName,
    serviceName,
    durationMinutes,
    timeLabel,
    logoUri: logoUri ?? undefined,
    existingReviewRating,
    subtitle,
    expandedSubtitle: stage === 3 ? formatBookingStage3ExpandedSubtitle() : undefined,
    ctaLabel: stageConfig.ctaLabel,
    ctaKind: stageConfig.ctaKind,
    progressPhase: stageConfig.progressPhase,
    countdownHours: countdown?.hours,
    countdownMinutes: countdown?.minutes,
    deepLinkUrl: buildBookingActivityDeepLinkForStage(booking, stage),
  };
}
