import type { Booking } from '@/api/bookings';
import { after } from 'expo-widgets';
import BookingActivity from '@/widgets/BookingActivity';
import {
  BOOKING_EXCEPTION_LINGER_MS,
  BOOKING_REVIEW_STAGE,
  buildBookingActivityDeepLinkForStage,
  buildBookingActivityProps,
  getBookingActivityReviewDismissDelayMs,
  getBookingActivityStageKind,
  getBookingActivityStageTimes,
  isBookingLiveActivityReviewEligible,
  pickBookingLiveActivityBooking,
} from '@/utils/bookingLiveActivityData';
import { getBookingStartDate, isBookingMarkedCompleted } from '@/utils/bookingHelpers';
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
let lastBookings: Booking[] = [];
let endTimer: ReturnType<typeof setTimeout> | null = null;
let stageTimers: ReturnType<typeof setTimeout>[] = [];
let countdownMinuteTimer: ReturnType<typeof setInterval> | null = null;
/** Po zrušení/přesunu neznovu nespouštět LA pro stejnou rezervaci (např. po přesunu). */
const exceptionEndedUntilMs = new Map<string, number>();

function clearCountdownMinuteTimer(): void {
  if (countdownMinuteTimer) {
    clearInterval(countdownMinuteTimer);
    countdownMinuteTimer = null;
  }
}

function clearEndTimer(): void {
  if (endTimer) {
    clearTimeout(endTimer);
    endTimer = null;
  }
}

function clearStageTimers(): void {
  stageTimers.forEach(clearTimeout);
  stageTimers = [];
  clearCountdownMinuteTimer();
}

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
  clearEndTimer();
  clearStageTimers();
  detachActivityPushTokenRegistration();
  activityRef?.end('immediate');
  resetActivityTracking();
}

function endActivityWithException(
  booking: Booking,
  logoUri: string | null,
  nowMs: number
): void {
  clearEndTimer();
  clearStageTimers();
  detachActivityPushTokenRegistration();

  const props = buildBookingActivityProps(booking, logoUri, nowMs);
  const dismissAt = new Date(nowMs + BOOKING_EXCEPTION_LINGER_MS);
  exceptionEndedUntilMs.set(booking.id, dismissAt.getTime());

  void activityRef?.end(after(dismissAt), props);
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

/** Obnoví activityRef z iOS, když JS stav vypadl (restart app, hot reload). */
function adoptExistingActivityEarly(booking: Booking): void {
  adoptExistingActivityIfNeeded(booking);
}

function scheduleStageUpdates(booking: Booking): void {
  clearStageTimers();
  const nowMs = Date.now();
  for (const atMs of getBookingActivityStageTimes(booking)) {
    if (atMs <= nowMs) continue;
    stageTimers.push(
      setTimeout(() => {
        void syncBookingLiveActivityFromBookings(lastBookings);
      }, atMs - nowMs)
    );
  }
  scheduleCountdownMinuteRefresh(booking);
}

function scheduleCountdownMinuteRefresh(booking: Booking): void {
  clearCountdownMinuteTimer();
  const appointmentMs = getBookingStartDate(booking).getTime();
  if (Date.now() >= appointmentMs) return;

  countdownMinuteTimer = setInterval(() => {
    if (Date.now() >= appointmentMs) {
      clearCountdownMinuteTimer();
      return;
    }
    void syncBookingLiveActivityFromBookings(lastBookings);
  }, 60_000);
}

function scheduleReviewDismiss(booking: Booking): void {
  clearEndTimer();
  const delayMs = getBookingActivityReviewDismissDelayMs(booking);
  if (delayMs <= 0) {
    endActivityImmediate();
    return;
  }
  endTimer = setTimeout(() => {
    detachActivityPushTokenRegistration();
    activityRef?.end('default');
    resetActivityTracking();
    endTimer = null;
  }, delayMs);
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

/** Přímý update běžící LA na review — obchází ztracený JS tracking. */
function pushReviewStageToRunningInstance(
  booking: Booking,
  logoUri: string | null,
  nowMs: number
): boolean {
  if (!isBookingLiveActivityReviewEligible(booking, nowMs)) return false;

  const instance = resolveRunningActivityInstance();
  if (!instance) return false;

  activityRef = instance;
  trackedBookingId = booking.id;

  const props = buildBookingActivityProps(booking, logoUri, nowMs);
  if (props.stage < BOOKING_REVIEW_STAGE) return false;

  const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(booking, props.stage);
  instance.update(props);
  trackedStage = props.stage;
  trackedDeepLinkUrl = deepLink;
  trackedLogoUri = logoUri;
  clearStageTimers();
  scheduleReviewDismiss(booking);
  return true;
}

async function maybePushReviewForTrackedBooking(
  bookings: Booking[],
  logoUri: string | null,
  nowMs: number
): Promise<boolean> {
  const cachedBookingId = trackedBookingId ?? (await getCachedLiveActivityBookingId());
  if (!cachedBookingId) return false;

  const booking = bookings.find((row) => row.id === cachedBookingId);
  if (!booking || !isBookingMarkedCompleted(booking)) return false;

  return pushReviewStageToRunningInstance(booking, logoUri, nowMs);
}

/** Sync nejbližší rezervace do iOS Live Activity (Lock Screen + Dynamic Island). */
export async function syncBookingLiveActivityFromBookings(bookings: Booking[]): Promise<void> {
  lastBookings = bookings;

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
      if (pushReviewStageToRunningInstance(next, logoUri, nowMs)) {
        return;
      }
      const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(next, props.stage);
      const enteringReviewStage = trackedStage !== BOOKING_REVIEW_STAGE;
      const deepLinkChanged = trackedDeepLinkUrl !== deepLink;
      const sameBookingActivity =
        activityRef != null && trackedBookingId === next.id;

      if (sameBookingActivity && (enteringReviewStage || deepLinkChanged || logoUriChanged)) {
        activityRef.update(props);
        trackedStage = props.stage;
        trackedDeepLinkUrl = deepLink;
        trackedLogoUri = logoUri;
      } else if (
        trackedBookingId !== next.id ||
        !activityRef ||
        enteringReviewStage ||
        deepLinkChanged ||
        logoUriChanged
      ) {
        startOrRestartActivity(next, props, logoUri ?? '');
      } else {
        activityRef.update(props);
        trackedLogoUri = logoUri;
      }
      clearStageTimers();
      scheduleReviewDismiss(next);
      return;
    }

    const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(next, props.stage);
    const deepLinkChanged = trackedDeepLinkUrl !== deepLink;

    adoptExistingActivityIfNeeded(next);

    if (trackedBookingId !== next.id) {
      endActivityImmediate();
      startOrRestartActivity(next, props, logoUri ?? '');
      scheduleStageUpdates(next);
      return;
    }

    if (!activityRef) {
      startOrRestartActivity(next, props, logoUri ?? '');
      scheduleStageUpdates(next);
      return;
    }

    if (deepLinkChanged || logoUriChanged) {
      startOrRestartActivity(next, props, logoUri ?? '');
      scheduleStageUpdates(next);
      return;
    }

    activityRef?.update(props);
    trackedStage = props.stage;
    trackedLogoUri = logoUri;
    clearEndTimer();
    scheduleStageUpdates(next);
  } catch (error) {
    if (__DEV__) {
      console.warn('[live-activity] sync failed', error);
    }
  }
}
