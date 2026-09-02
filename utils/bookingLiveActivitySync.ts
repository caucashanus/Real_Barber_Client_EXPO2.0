import { Platform } from 'react-native';

import type { Booking } from '@/api/bookings';
import BookingActivity from '@/widgets/BookingActivity';
import {
  BOOKING_DONE_LINGER_MS,
  buildBookingActivityDeepLink,
  buildBookingActivityProps,
  getBookingActivityStageTimes,
  pickBookingLiveActivityBooking,
} from '@/utils/bookingLiveActivityData';
import { ensureLiveActivityLogoUri } from '@/utils/widgetSharedAssets';

type ActivityInstance = ReturnType<typeof BookingActivity.start>;

let activityRef: ActivityInstance | null = null;
let trackedBookingId: string | null = null;
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
  activityRef?.end('immediate');
  activityRef = null;
  trackedBookingId = null;
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

function scheduleDoneDismiss(): void {
  clearEndTimer();
  endTimer = setTimeout(() => {
    activityRef?.end('default');
    activityRef = null;
    trackedBookingId = null;
    endTimer = null;
  }, BOOKING_DONE_LINGER_MS);
}

/** Sync nejbližší rezervace do iOS Live Activity (Lock Screen + Dynamic Island). */
export async function syncBookingLiveActivityFromBookings(bookings: Booking[]): Promise<void> {
  if (Platform.OS !== 'ios') return;

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
    const deepLink = buildBookingActivityDeepLink(next);

    if (props.stage >= 3) {
      if (trackedBookingId === next.id && activityRef) {
        clearStageTimers();
        activityRef.update(props);
        scheduleDoneDismiss();
        return;
      }
      endActivityImmediate();
      return;
    }

    if (trackedBookingId !== next.id) {
      endActivityImmediate();
      activityRef = BookingActivity.start(props, deepLink);
      trackedBookingId = next.id;
      scheduleStageUpdates(next);
      return;
    }

    activityRef?.update(props);
    scheduleStageUpdates(next);
  } catch (error) {
    if (__DEV__) {
      console.warn('[live-activity] sync failed', error);
    }
  }
}
