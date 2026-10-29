import type { Booking } from '@/api/bookings';
import { getBranchNavigateMapsQuery } from '@/utils/branchNavigationUrls';
import {
  canShareClientBooking,
  getBookingClientReviewRating,
  isBookingCancelledLike,
  isBookingPast,
} from '@/utils/bookingHelpers';
import {
  clientBookingManageLifecycleIsConfirmed,
  getClientBookingUiStatus,
  showBookingConfirmPrompt,
} from '@/utils/bookingManage';
import { type HomeSpotlightState, resolveBookingSpotlightKind } from '@/utils/homeSpotlight';
import { isKidsHaircutBooking } from '@/utils/isKidsHaircutBooking';
import { shouldShowClientBookingNavigatePill } from '@/utils/reservationDetailBranchNavigate';
import type { TranslationKey } from '@/locales';

/** Jednotná fáze titulku — home spotlight i detail rezervace. */
export type ClientBookingSpotlightPhase =
  | 'no_show'
  | 'cancelled'
  | 'needs_confirmation'
  | 'lifecycle_confirmed'
  | 'current'
  | 'soon'
  | 'today'
  | 'upcoming'
  | 'review';

export type SpotlightStatusDot = 'red' | 'amber' | 'green' | 'green_live';

export type SpotlightBottomRowLeft = 'none' | 'countdown' | 'slot_pill';

export type SpotlightBottomRowAction = 'none' | 'navigate' | 'call' | 'calendar';

export type ClientBookingSpotlightPresentation = {
  phase: ClientBookingSpotlightPhase | null;
  timeKind: HomeSpotlightState | null;
  statusDot: SpotlightStatusDot | null;
  showHeaderCountdownPill: boolean;
  bottomRowLeft: SpotlightBottomRowLeft;
  bottomRowAction: SpotlightBottomRowAction;
  actions: {
    confirm: boolean;
    navigate: boolean;
    call: boolean;
    calendar: boolean;
    share: boolean;
  };
  linkTarget: 'detail' | 'review';
  hasReviewRating: boolean;
};

function canAddBookingToCalendar(booking: Booking): boolean {
  if (isKidsHaircutBooking(booking)) return false;
  if (isBookingCancelledLike(booking)) return false;
  if (isBookingPast(booking)) return false;
  return true;
}

/**
 * Jediný zdroj pravdy pro titulek, tečku, odpočet a akce (home spotlight + detail).
 * Port 1:1 z web `clientBookingSpotlightPresentation.ts`.
 */
export function resolveClientBookingSpotlightPresentation(
  booking: Booking,
  nowMs: number = Date.now()
): ClientBookingSpotlightPresentation {
  const uiStatus = getClientBookingUiStatus(booking, nowMs);
  const cancelledLike = isBookingCancelledLike(booking);
  const rating = getBookingClientReviewRating(booking);
  const hasReviewRating = rating != null;
  const navigateQuery = getBranchNavigateMapsQuery(
    booking.branch?.name,
    booking.branch?.address
  );
  const canOpenBranchNavigate = !cancelledLike && navigateQuery !== '';
  const inNavigateWindow = shouldShowClientBookingNavigatePill(booking, { nowMs });
  const canCalendar = canAddBookingToCalendar(booking);
  const canShare = canShareClientBooking(booking, nowMs);

  const baseActions = {
    confirm: showBookingConfirmPrompt(booking, nowMs),
    navigate: canOpenBranchNavigate && inNavigateWindow,
    call: !cancelledLike && !inNavigateWindow,
    calendar: canCalendar,
    share: canShare,
  };

  const empty: ClientBookingSpotlightPresentation = {
    phase: null,
    timeKind: null,
    statusDot: null,
    showHeaderCountdownPill: false,
    bottomRowLeft: 'none',
    bottomRowAction: 'none',
    actions: {
      confirm: baseActions.confirm,
      navigate: false,
      call: false,
      calendar: false,
      share: false,
    },
    linkTarget: 'detail',
    hasReviewRating,
  };

  if (uiStatus === 'no_show') {
    return {
      ...empty,
      phase: 'no_show',
      statusDot: 'red',
      actions: { ...empty.actions, confirm: false },
    };
  }

  if (uiStatus === 'cancelled') {
    return {
      ...empty,
      phase: 'cancelled',
      statusDot: 'red',
      actions: { ...empty.actions, confirm: false },
    };
  }

  if (showBookingConfirmPrompt(booking, nowMs)) {
    return {
      ...empty,
      phase: 'needs_confirmation',
      statusDot: 'amber',
      actions: {
        ...baseActions,
        navigate: baseActions.navigate,
        call: baseActions.call,
        calendar: baseActions.calendar,
        share: false,
      },
    };
  }

  const timeKind = resolveBookingSpotlightKind(booking, nowMs);
  if (!timeKind) {
    return empty;
  }

  let phase: ClientBookingSpotlightPhase;
  let statusDot: SpotlightStatusDot | null = null;
  let showHeaderCountdownPill = false;

  if (timeKind === 'current') {
    phase = 'current';
    statusDot = 'green_live';
  } else if (timeKind === 'soon') {
    phase = 'soon';
    statusDot = 'amber';
    showHeaderCountdownPill = true;
  } else if (timeKind === 'today') {
    phase = 'today';
    statusDot = 'amber';
    showHeaderCountdownPill = true;
  } else if (timeKind === 'upcoming') {
    if (clientBookingManageLifecycleIsConfirmed(booking)) {
      phase = 'lifecycle_confirmed';
      statusDot = 'green';
    } else {
      phase = 'upcoming';
      statusDot = 'amber';
      showHeaderCountdownPill = true;
    }
  } else {
    phase = 'review';
    statusDot = null;
  }

  const actions = {
    confirm: false,
    navigate: baseActions.navigate,
    call: baseActions.call,
    calendar: baseActions.calendar,
    share: phase === 'current' && baseActions.share,
  };

  let bottomRowLeft: SpotlightBottomRowLeft = 'none';
  let bottomRowAction: SpotlightBottomRowAction = 'none';

  if (phase === 'soon') {
    bottomRowLeft = 'countdown';
    if (actions.navigate) bottomRowAction = 'navigate';
    else if (actions.call) bottomRowAction = 'call';
  } else if (
    phase === 'today' ||
    phase === 'upcoming' ||
    phase === 'lifecycle_confirmed'
  ) {
    bottomRowLeft = 'slot_pill';
    if (actions.navigate) bottomRowAction = 'navigate';
    else if (actions.call) bottomRowAction = 'call';
    else if (actions.calendar) bottomRowAction = 'calendar';
  }

  return {
    phase,
    timeKind,
    statusDot,
    showHeaderCountdownPill,
    bottomRowLeft,
    bottomRowAction,
    actions,
    linkTarget: phase === 'review' ? 'review' : 'detail',
    hasReviewRating,
  };
}

export function spotlightPresentationShowsStatusHeader(
  presentation: ClientBookingSpotlightPresentation
): boolean {
  return presentation.phase != null;
}

export function spotlightPhaseTitleKey(
  phase: ClientBookingSpotlightPhase,
  hasReviewRating: boolean
): TranslationKey {
  switch (phase) {
    case 'no_show':
      return 'bookingDetailStatusHeaderNoShow';
    case 'cancelled':
      return 'bookingDetailStatusHeaderCancelled';
    case 'needs_confirmation':
      return 'bookingDetailStatusNeedsConfirmation';
    case 'lifecycle_confirmed':
      return 'bookingDetailStatusConfirmed';
    case 'current':
      return 'homeSpotlightCurrent';
    case 'soon':
      return 'homeSpotlightSoon';
    case 'today':
      return 'homeSpotlightToday';
    case 'upcoming':
      return 'homeSpotlightUpcoming';
    case 'review':
      return hasReviewRating ? 'homeSpotlightReviewRated' : 'homeSpotlightReview';
  }
}

export function spotlightStatusDotLiveVariant(
  dot: SpotlightStatusDot | null
): { variant: 'red' | 'orange' | 'green'; animated: boolean } | null {
  if (!dot) return null;
  if (dot === 'red') return { variant: 'red', animated: false };
  if (dot === 'amber') return { variant: 'orange', animated: false };
  if (dot === 'green') return { variant: 'green', animated: false };
  return { variant: 'green', animated: true };
}
