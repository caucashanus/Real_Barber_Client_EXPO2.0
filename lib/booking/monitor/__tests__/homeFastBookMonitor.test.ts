import { describe, expect, it } from 'vitest';

import { buildBookingMonitorPayload } from '@/lib/booking/monitor/post';

describe('home-fast-book monitor payload', () => {
  it('includes homeFastBook fields when entry is home-fast-book', () => {
    const payload = buildBookingMonitorPayload(
      'session_started',
      'home-fast-book',
      'abcdefgh12345678',
      { locale: 'cs' },
      { clientName: 'Jan', phone: '+420123', userAgent: 'RB-iOS/1' },
      { mode: 'later', path: 'lista-pill-pozdeji' }
    );
    expect(payload.homeFastBookMode).toBe('later');
    expect(payload.homeFastBookPath).toBe('lista-pill-pozdeji');
    expect(payload.entry).toBe('home-fast-book');
    expect(payload.source).toBe('app');
    expect(payload.sessionId.length).toBeGreaterThanOrEqual(8);
  });
});
