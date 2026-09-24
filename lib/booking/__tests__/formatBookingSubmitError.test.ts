import { describe, expect, it } from 'vitest';

import { BookingApiError } from '@/lib/booking/booking-api/errors';
import { formatBookingSubmitError } from '@/hooks/useBookingReservationSubmit';

const t = (key: string) => key;

describe('formatBookingSubmitError', () => {
  it('maps opaque backend validation text to generic message', () => {
    const err = new BookingApiError('Too small: expected string to have >=1 characters', 400);
    expect(formatBookingSubmitError(err, t)).toBe('reservationErrorGeneric');
  });

  it('maps profileIncomplete to booking summary key', () => {
    expect(formatBookingSubmitError(new Error('profileIncomplete'), t)).toBe(
      'bookingSummaryProfileIncomplete'
    );
  });
});
