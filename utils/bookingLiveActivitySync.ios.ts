import type { Booking } from '@/api/bookings';
import { after } from 'expo-widgets';
import BookingActivity from '@/widgets/BookingActivity';
import {
  BOOKING_EXCEPTION_LINGER_MS,
  BOOKING_REVIEW_LINGER_MS,
  BOOKING_REVIEW_STAGE,
  buildBookingActivityDeepLinkForStage,
  buildBookingActivityProps,
  getBookingActivityStageKind,
  isBookingLiveActivityReviewEligible,
  pickBookingLiveActivityBooking,
} from '@/utils/bookingLiveActivityData';
import { getBookingEndDate } from '@/utils/bookingHelpers';
import {
  attachActivityPushTokenRegistration,
  detachActivityPushTokenRegistration,
  getCachedLiveActivityBookingId,
} from '@/utils/liveActivityPushTokens';
import { ensureLiveActivityLogoUri } from '@/utils/widgetSharedAssets';

type ActivityInstance = ReturnType<typeof BookingActivity.start>;

let activityRef: ActivityInstance | null = null;
let trackedBookingId: string | null = null;
let trackedStage: number | null = null;
let trackedDeepLinkUrl: string | null = null;
let trackedLogoUri: string | null = null;
/** Po zrušení/přesunu neznovu nespouštět LA pro stejnou rezervaci (např. po přesunu). */
const exceptionEndedUntilMs = new Map<string, number>();

function resetActivityTracking(): void {
  activityRef = null;
  trackedBookingId = null;
  trackedStage = null;
  trackedDeepLinkUrl = null;
  trackedLogoUri = null;
}

function isBookingInExceptionLinger(bookingId: string, nowMs: number): boolean {
  const until = exceptionEndedUntilMs.get(bookingId);
  if (until == null) return false;
  if (nowMs >= until) {
    exceptionEndedUntilMs.delete(bookingId);
    return false;
  }
  return true;
}

function filterBookingsForLiveActivity(bookings: Booking[], nowMs: number): Booking[] {
  return bookings.filter((booking) => !isBookingInExceptionLinger(booking.id, nowMs));
}

function endActivityImmediate(): void {
  detachActivityPushTokenRegistration();
  activityRef?.end('immediate');
  resetActivityTracking();
}

function endActivityWithException(
  booking: Booking,
  logoUri: string | null,
  nowMs: number
): void {
  detachActivityPushTokenRegistration();

  const props = buildBookingActivityProps(booking, logoUri, nowMs);
  const dismissAt = new Date(nowMs + BOOKING_EXCEPTION_LINGER_MS);
  exceptionEndedUntilMs.set(booking.id, dismissAt.getTime());

  void activityRef?.end(after(dismissAt), props);
  resetActivityTracking();
}

/** Review linger přes ActivityKit `after()` — bez JS timerů. */
function finalizeReviewActivity(
  booking: Booking,
  props: ReturnType<typeof buildBookingActivityProps>,
  nowMs: number
): void {
  const instance = resolveRunningActivityInstance();
  if (!instance) return;

  activityRef = instance;
  trackedBookingId = booking.id;
  trackedStage = props.stage;
  trackedDeepLinkUrl =
    props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(booking, props.stage);
  trackedLogoUri = props.logoUri ?? trackedLogoUri;

  const dismissAt = new Date(getBookingEndDate(booking).getTime() + BOOKING_REVIEW_LINGER_MS);
  detachActivityPushTokenRegistration();

  if (dismissAt.getTime() <= nowMs) {
    void instance.end('immediate');
  } else {
    void instance.end(after(dismissAt), props);
  }
  resetActivityTracking();
}

function adoptExistingActivityIfNeeded(booking: Booking): boolean {
  if (activityRef) {
    const instances = BookingActivity.getInstances();
    if (instances.includes(activityRef)) return true;
    activityRef = null;
  }

  const instances = BookingActivity.getInstances();
  if (instances.length !== 1) return false;

  activityRef = instances[0];
  trackedBookingId = booking.id;
  attachActivityPushTokenRegistration(activityRef, booking.id);
  return true;
}

function adoptExistingActivityEarly(booking: Booking): void {
  adoptExistingActivityIfNeeded(booking);
}

function startOrRestartActivity(
  booking: Booking,
  props: ReturnType<typeof buildBookingActivityProps>,
  logoUri: string
): void {
  const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(booking, props.stage);
  if (activityRef) {
    activityRef.end('immediate');
  }
  activityRef = BookingActivity.start(props, deepLink);
  trackedBookingId = booking.id;
  trackedStage = props.stage;
  trackedDeepLinkUrl = deepLink;
  trackedLogoUri = logoUri;
  attachActivityPushTokenRegistration(activityRef, booking.id);
}

function maybeEndRunningActivityForException(
  bookings: Booking[],
  logoUri: string | null,
  nowMs: number
): boolean {
  if (!activityRef || !trackedBookingId) return false;

  const tracked = bookings.find((booking) => booking.id === trackedBookingId);
  if (!tracked) return false;

  const stageKind = getBookingActivityStageKind(tracked);
  if (stageKind !== 'cancelled' && stageKind !== 'rescheduled') return false;

  endActivityWithException(tracked, logoUri, nowMs);
  return true;
}

function resolveRunningActivityInstance(): ActivityInstance | null {
  const instances = BookingActivity.getInstances();
  if (activityRef && instances.includes(activityRef)) return activityRef;
  if (instances.length >= 1) {
    activityRef = instances[0];
    return activityRef;
  }
  return activityRef;
}

async function maybePushReviewForTrackedBooking(
  bookings: Booking[],
  logoUri: string | null,
  nowMs: number
): Promise<boolean> {
  const cachedBookingId = trackedBookingId ?? (await getCachedLiveActivityBookingId());
  if (!cachedBookingId) return false;

  const booking = bookings.find((row) => row.id === cachedBookingId);
  if (!booking || !isBookingLiveActivityReviewEligible(booking, nowMs)) return false;

  const props = buildBookingActivityProps(booking, logoUri, nowMs);
  if (props.stage < BOOKING_REVIEW_STAGE) return false;
  if (!resolveRunningActivityInstance()) return false;

  finalizeReviewActivity(booking, props, nowMs);
  return true;
}

/**
 * Sync nejbližší rezervace do iOS Live Activity.
 * Stage přechody spoléhají na: sync při změně dat, návrat app do popředí, CRM ActivityKit push.
 */
export async function syncBookingLiveActivityFromBookings(bookings: Booking[]): Promise<void> {
  try {
    const logoUri = await ensureLiveActivityLogoUri();
    const nowMs = Date.now();

    maybeEndRunningActivityForException(bookings, logoUri, nowMs);

    const eligibleBookings = filterBookingsForLiveActivity(bookings, nowMs);
    if (await maybePushReviewForTrackedBooking(eligibleBookings, logoUri, nowMs)) {
      return;
    }

    const next = pickBookingLiveActivityBooking(eligibleBookings, nowMs);

    if (!next) {
      if (activityRef) endActivityImmediate();
      return;
    }

    adoptExistingActivityEarly(next);

    const props = buildBookingActivityProps(next, logoUri, nowMs);
    const logoUriChanged = trackedLogoUri !== logoUri;

    if (props.stageKind === 'cancelled' || props.stageKind === 'rescheduled') {
      if (activityRef && trackedBookingId === next.id) {
        endActivityWithException(next, logoUri, nowMs);
      }
      return;
    }

    if (props.stage >= BOOKING_REVIEW_STAGE) {
      if (!isBookingLiveActivityReviewEligible(next, nowMs)) {
        endActivityImmediate();
        return;
      }
      if (!resolveRunningActivityInstance()) {
        startOrRestartActivity(next, props, logoUri ?? '');
      }
      finalizeReviewActivity(next, props, nowMs);
      return;
    }

    const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(next, props.stage);
    const deepLinkChanged = trackedDeepLinkUrl !== deepLink;

    adoptExistingActivityIfNeeded(next);

    if (trackedBookingId !== next.id) {
      endActivityImmediate();
      startOrRestartActivity(next, props, logoUri ?? '');
      return;
    }

    if (!activityRef) {
      startOrRestartActivity(next, props, logoUri ?? '');
      return;
    }

    if (deepLinkChanged || logoUriChanged) {
      startOrRestartActivity(next, props, logoUri ?? '');
      return;
    }

    activityRef.update(props);
    trackedStage = props.stage;
    trackedLogoUri = logoUri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[live-activity] sync failed', error);
    }
  }
}
