import { describe, expect, it } from 'vitest';

import {
  buildReservationSharePayload,
  buildReservationShareUrl,
  formatReservationShareShortDate,
} from '@/utils/reservationShareHelpers';

describe('reservationShareHelpers', () => {
  const booking = {
    id: '3f7b9c5a-1111-4444-9999-abcdef123456',
    date: '2026-08-10',
    slotStart: '16:00',
    slotEnd: '16:30',
    branch: { id: 'b1', name: 'Real Barber Barrandov' },
  };

  it('builds CS share URL with trailing slash', () => {
    expect(buildReservationShareUrl(booking.id, 'cs')).toBe(
      'https://realbarber.cz/r/3f7b9c5a-1111-4444-9999-abcdef123456/'
    );
  });

  it('builds EN share URL with locale prefix', () => {
    expect(buildReservationShareUrl(booking.id, 'en')).toBe(
      'https://realbarber.cz/en/r/3f7b9c5a-1111-4444-9999-abcdef123456/'
    );
  });

  it('formats CS short date with weekday', () => {
    const label = formatReservationShareShortDate('2026-08-10', 'cs');
    expect(label).toMatch(/10\. 8\./);
  });

  it('builds legacy share payload for OG reference copy', () => {
    const payload = buildReservationSharePayload(booking, 'cs');
    expect(payload.title).toContain('Real Barber');
    expect(payload.url).toContain('/r/');
    expect(payload.text).toContain(payload.url);
    expect(payload.text).toContain('16:00–16:30');
    expect(payload.text).toContain('Real Barber Barrandov');
    expect(payload.text).not.toMatch(/@\w+/);
  });

  it('builds EN share payload', () => {
    const payload = buildReservationSharePayload(booking, 'en');
    expect(payload.title).toContain('Check out my booking');
    expect(payload.text).toContain('I shared my Real Barber booking');
  });

  it('uses slotStart when slotEnd is missing', () => {
    const payload = buildReservationSharePayload(
      { ...booking, slotEnd: '' },
      'cs'
    );
    expect(payload.text).toContain('16:00–16:00');
  });
});
