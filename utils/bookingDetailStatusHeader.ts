import type { Booking } from '@/api/bookings';
import type { TranslationKey } from '@/locales';
import {
  resolveClientBookingSpotlightPresentation,
  spotlightPhaseTitleKey,
  spotlightPresentationShowsStatusHeader,
  spotlightStatusDotLiveVariant,
} from '@/utils/clientBookingSpotlightPresentation';

export type BookingDetailStatusHeaderVariant = 'red' | 'amber' | 'green';

export type BookingDetailStatusHeaderModel = {
  titleKey: TranslationKey;
  variant: BookingDetailStatusHeaderVariant;
  dotAnimated: boolean;
  showStatusDot: boolean;
  showCountdownPill: boolean;
  showReviewStars: boolean;
};

function dotToHeaderVariant(
  dot: ReturnType<typeof spotlightStatusDotLiveVariant>
): BookingDetailStatusHeaderVariant {
  if (!dot) return 'amber';
  if (dot.variant === 'red') return 'red';
  if (dot.variant === 'orange') return 'amber';
  return 'green';
}

/** Skrýt duplicitní řádek „Stav“ v sekci Detaily (parita web). */
export function bookingDetailShowsStatusHeader(
  booking: Booking,
  nowMs: number = Date.now()
): boolean {
  const presentation = resolveClientBookingSpotlightPresentation(booking, nowMs);
  return spotlightPresentationShowsStatusHeader(presentation);
}

export function resolveBookingDetailStatusHeader(
  booking: Booking,
  nowMs: number
): BookingDetailStatusHeaderModel | null {
  const presentation = resolveClientBookingSpotlightPresentation(booking, nowMs);
  if (!presentation.phase) return null;

  const live = spotlightStatusDotLiveVariant(presentation.statusDot);

  return {
    titleKey: spotlightPhaseTitleKey(presentation.phase, presentation.hasReviewRating),
    variant: dotToHeaderVariant(live),
    dotAnimated: live?.animated ?? false,
    showStatusDot: live != null,
    showCountdownPill: presentation.showHeaderCountdownPill,
    showReviewStars: presentation.phase === 'review',
  };
}
