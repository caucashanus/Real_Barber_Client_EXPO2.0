import type { Booking } from '@/api/bookings';
import BookingActivity from '@/widgets/BookingActivity';
import {
  buildBookingActivityDeepLinkForStage,
  buildBookingActivityProps,
  getBookingActivityReviewDismissDelayMs,
  getBookingActivityStageTimes,
  isBookingLiveActivityReviewEligible,
  pickBookingLiveActivityBooking,
} from '@/utils/bookingLiveActivityData';
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
let lastBookings: Booking[] = [];
let endTimer: ReturnType<typeof setTimeout> | null = null;
let stageTimers: ReturnType<typeof setTimeout>[] = [];

function clearEndTimer(): void {
  if (endTimer) {
    clearTimeout(endTimer);
    endTimer = null;
  }
}

function clearStageTimers(): void {
  stageTimers.forEach(clearTimeout);
  stageTimers = [];
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
}

function adoptExistingActivityIfNeeded(booking: Booking): boolean {
  if (activityRef) return true;

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
    endTimer = null;
  }, delayMs);
}

function startOrRestartActivity(
  booking: Booking,
  props: ReturnType<typeof buildBookingActivityProps>
): void {
  const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(booking, props.stage);
  if (activityRef) {
    activityRef.end('immediate');
  }
  activityRef = BookingActivity.start(props, deepLink);
  trackedBookingId = booking.id;
  trackedStage = props.stage;
  trackedDeepLinkUrl = deepLink;
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

    if (props.stage >= 3) {
      if (!isBookingLiveActivityReviewEligible(next, nowMs)) {
        endActivityImmediate();
        return;
      }
      adoptExistingActivityIfNeeded(next);
      const deepLink = props.deepLinkUrl ?? buildBookingActivityDeepLinkForStage(next, props.stage);
      const enteringReviewStage = trackedStage !== 3;
      const deepLinkChanged = trackedDeepLinkUrl !== deepLink;
      if (
        trackedBookingId !== next.id ||
        !activityRef ||
        enteringReviewStage ||
        deepLinkChanged
      ) {
        startOrRestartActivity(next, props);
      } else {
        activityRef.update(props);
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
      startOrRestartActivity(next, props);
      scheduleStageUpdates(next);
      return;
    }

    if (deepLinkChanged) {
      startOrRestartActivity(next, props);
      scheduleStageUpdates(next);
      return;
    }

    activityRef?.update(props);
    trackedStage = props.stage;
    clearEndTimer();
    scheduleStageUpdates(next);
  } catch (error) {
    if (__DEV__) {
      console.warn('[live-activity] sync failed', error);
    }
  }
}
