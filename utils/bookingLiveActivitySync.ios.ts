import type { Booking } from '@/api/bookings';
import BookingActivity from '@/widgets/BookingActivity';
import {
  BOOKING_REVIEW_STAGE,
  buildBookingActivityDeepLinkForStage,
  buildBookingActivityProps,
  getBookingActivityReviewDismissDelayMs,
  getBookingActivityStageTimes,
  isBookingLiveActivityReviewEligible,
  pickBookingLiveActivityBooking,
} from '@/utils/bookingLiveActivityData';
import { getBookingStartDate } from '@/utils/bookingHelpers';
import {
  attachActivityPushTokenRegistration,
  detachActivityPushTokenRegistration,
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

function endActivityImmediate(): void {
  clearEndTimer();
  clearStageTimers();
  detachActivityPushTokenRegistration();
  activityRef?.end('immediate');
  activityRef = null;
  trackedBookingId = null;
  trackedStage = null;
  trackedDeepLinkUrl = null;
  trackedLogoUri = null;
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
    activityRef = null;
    trackedBookingId = null;
    trackedStage = null;
    trackedDeepLinkUrl = null;
    trackedLogoUri = null;
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

/** Sync nejbližší rezervace do iOS Live Activity (Lock Screen + Dynamic Island). */
export async function syncBookingLiveActivityFromBookings(bookings: Booking[]): Promise<void> {
  lastBookings = bookings;

  try {
    const logoUri = await ensureLiveActivityLogoUri();
    const next = pickBookingLiveActivityBooking(bookings);
    const nowMs = Date.now();

    if (!next) {
      endActivityImmediate();
      return;
    }

    const props = buildBookingActivityProps(next, logoUri, nowMs);
    const logoUriChanged = trackedLogoUri !== logoUri;

    if (props.stage >= BOOKING_REVIEW_STAGE) {
      if (!isBookingLiveActivityReviewEligible(next, nowMs)) {
        endActivityImmediate();
        return;
      }
      adoptExistingActivityIfNeeded(next);
      const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(next, props.stage);
      const enteringReviewStage = trackedStage !== BOOKING_REVIEW_STAGE;
      const deepLinkChanged = trackedDeepLinkUrl !== deepLink;
      if (
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
