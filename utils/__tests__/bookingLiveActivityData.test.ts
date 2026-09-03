import { describe, expect, it, vi } from 'vitest';

import type { Booking } from '@/api/bookings';

vi.mock('@/utils/homeSpotlight', () => ({
  getHomeSpotlightReviewQueryString: (booking: { id: string }) =>
    `entityType=reservation&entityId=${encodeURIComponent(booking.id)}&entityName=St%C5%99ih&entityDate=16.%206.&entityTime=10%3A00&entityBranch=Mod%C5%99any`,
}));

vi.mock('@/constants/branchContacts', () => ({
  getBranchContactMeta: () => ({
    shortLabel: 'Modřany',
    address: 'Čs. exilu 40, Praha 12',
    latitude: 50.004774,
    longitude: 14.416534,
  }),
}));

vi.mock('@/utils/branchNavigationUrls', () => ({
  buildBranchGoogleMapsUrl: (
    _name?: string | null,
    _address?: string | null,
    latitude?: number | null,
    longitude?: number | null
  ) =>
    latitude != null && longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : 'https://www.google.com/maps/search/?api=1&query=modrany',
}));

import {
  BOOKING_LA_START_MS,
  BOOKING_REVIEW_STAGE,
  BOOKING_STAGE_LABELS,
  buildBookingActivityDeepLinkForStage,
  buildBookingActivityProps,
  computeBookingActivityStage,
  formatBookingCountdownHm,
  previewNowMsForStage,
  shouldTrackBookingLiveActivity,
} from '@/utils/bookingLiveActivityData';

function makeBooking(overrides: Partial<Booking> & Pick<Booking, 'id' | 'date' | 'slotStart'>): Booking {
  return {
    clientId: 'c1',
    employeeId: 'e1',
    branchId: 'd15ee0b6-2e66-4edf-a4d1-5f87a89535a3',
    itemId: 'i1',
    slotEnd: '11:00',
    duration: 60,
    price: 500,
    status: 'scheduled',
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
    employee: { id: 'e1', name: 'Jan Novák' },
    branch: { id: 'b1', name: 'Modřany' },
    item: { id: 'i1', name: 'Střih', imageUrl: 'https://example.com/strih.jpg' },
    ...overrides,
  };
}

describe('buildBookingActivityProps', () => {
  it('builds stage 0 props with T−90 soonEpochMs', () => {
    const now = new Date('2026-06-16T08:30:00').getTime();
    const booking = makeBooking({ id: 'res-1', date: '2026-06-16', slotStart: '10:00' });
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.bookingId).toBe('res-1');
    expect(props.stage).toBe(0);
    expect(props.status).toBe(BOOKING_STAGE_LABELS[0]);
    expect(props.soonEpochMs).toBe(props.appointmentEpochMs - BOOKING_LA_START_MS);
    expect(props.deepLinkUrl).toBe('realbarber://screens/booking-detail?id=res-1');
    expect(props.ctaKind).toBe('countdown');
    expect(props.progressPhase).toBe(0);
    expect(props.countdownHours).toBe(1);
    expect(props.countdownMinutes).toBe(30);
  });

  it('builds stage 1 with booking detail deep link that opens navigate sheet', () => {
    const booking = makeBooking({ id: 'res-nav', date: '2026-06-16', slotStart: '10:00' });
    const now = previewNowMsForStage(booking, 1);
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(1);
    expect(props.ctaKind).toBe('navigate');
    expect(props.deepLinkUrl).toBe(
      'realbarber://screens/booking-detail?id=res-nav&openNavigate=1'
    );
  });

  it('builds stage 2 with employee subtitle and countdown', () => {
    const booking = makeBooking({ id: 'res-2-stage', date: '2026-06-16', slotStart: '10:00' });
    const now = previewNowMsForStage(booking, 2);
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(2);
    expect(props.status).toBe('Kdo se o vás dnes postará?');
    expect(props.subtitle).toBe('Jan Novák se o vás dnes postará · klepněte pro detail.');
    expect(props.ctaKind).toBe('countdown');
    expect(props.deepLinkUrl).toBe('realbarber://screens/booking-detail?id=res-2-stage');
  });

  it('builds stage 3 with catalog copy and inspirace deep link', () => {
    const booking = makeBooking({ id: 'res-insp', date: '2026-06-16', slotStart: '10:00' });
    const now = previewNowMsForStage(booking, 3);
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(3);
    expect(props.status).toBe('Podívejte se na katalog účesů');
    expect(props.subtitle).toBe('Klepněte pro zobrazení');
    expect(props.expandedSubtitle).toBe('Klepněte pro zobrazení katalogu účesů');
    expect(props.ctaKind).toBe('inspire');
    expect(props.deepLinkUrl).toBe('realbarber://inspirace');
  });

  it('builds stage 4 with drinks copy and booking detail deep link', () => {
    const booking = makeBooking({ id: 'res-drinks', date: '2026-06-16', slotStart: '10:00' });
    const now = previewNowMsForStage(booking, 4);
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(4);
    expect(props.status).toBe('Je libo káva nebo limonáda?');
    expect(props.subtitle).toBe('Vyberte si z nabídky nápojů · personál vás rád obslouží');
    expect(props.ctaKind).toBe('drinks');
    expect(props.ctaLabel).toBe('Nápoje');
    expect(props.deepLinkUrl).toBe('realbarber://screens/booking-detail?id=res-drinks');
  });

  it('builds stage 5 with estimated duration subtitle and no duration CTA', () => {
    const booking = makeBooking({ id: 'res-live', date: '2026-06-16', slotStart: '10:00' });
    const now = previewNowMsForStage(booking, 5);
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(5);
    expect(props.status).toBe('Právě probíhá');
    expect(props.subtitle).toBe('Odhadovaná doba trvání · cca 60 min');
    expect(props.bannerLabel).toBe('Stará se o Vás · Jan Novák');
    expect(props.ctaKind).toBe('none');
    expect(props.subtitle).not.toContain('10:00');
  });

  it('builds review stage with review deep link', () => {
    const now = new Date('2026-06-16T11:30:00').getTime();
    const booking = makeBooking({ id: 'res-2', date: '2026-06-16', slotStart: '10:00', slotEnd: '11:00' });
    const props = buildBookingActivityProps(booking, null, now);

    expect(props.stage).toBe(BOOKING_REVIEW_STAGE);
    expect(props.status).toBe('Ohodnoťte');
    expect(props.deepLinkUrl).toContain('realbarber://screens/review?');
    expect(props.deepLinkUrl).toContain('entityType=reservation');
    expect(props.deepLinkUrl).toContain('entityId=res-2');
  });
});

describe('computeBookingActivityStage', () => {
  it('maps timeline boundaries to stages 0–7', () => {
    const booking = makeBooking({ id: 'x', date: '2026-06-16', slotStart: '10:00', slotEnd: '11:00' });

    expect(computeBookingActivityStage(booking, new Date('2026-06-16T08:30:00').getTime())).toBe(0);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T09:00:00').getTime())).toBe(1);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T09:40:00').getTime())).toBe(2);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T09:52:00').getTime())).toBe(3);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T09:57:00').getTime())).toBe(4);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T10:01:00').getTime())).toBe(5);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T10:00:00').getTime())).toBe(5);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T10:30:00').getTime())).toBe(5);
    expect(computeBookingActivityStage(booking, new Date('2026-06-16T11:30:00').getTime())).toBe(6);
  });
});

describe('shouldTrackBookingLiveActivity', () => {
  it('does not track before T−90', () => {
    const booking = makeBooking({ id: 'early', date: '2026-06-16', slotStart: '10:00' });
    const now = new Date('2026-06-16T08:00:00').getTime();
    expect(shouldTrackBookingLiveActivity(booking, now)).toBe(false);
  });

  it('tracks from T−90 until review window ends', () => {
    const booking = makeBooking({ id: 'ok', date: '2026-06-16', slotStart: '10:00', slotEnd: '11:00' });
    expect(shouldTrackBookingLiveActivity(booking, new Date('2026-06-16T08:30:00').getTime())).toBe(true);
    expect(shouldTrackBookingLiveActivity(booking, new Date('2026-06-16T11:30:00').getTime())).toBe(true);
  });
});

describe('formatBookingCountdownHm', () => {
  it('formats remaining time without seconds', () => {
    const appointment = new Date('2026-06-16T10:00:00').getTime();
    expect(formatBookingCountdownHm(appointment, new Date('2026-06-16T08:30:00').getTime())).toEqual({
      hours: 1,
      minutes: 30,
    });
    expect(formatBookingCountdownHm(appointment, new Date('2026-06-16T09:50:00').getTime())).toEqual({
      hours: 0,
      minutes: 10,
    });
  });
});

describe('buildBookingActivityDeepLinkForStage', () => {
  it('switches deep link per stage', () => {
    const booking = makeBooking({ id: 'res-3', date: '2026-06-16', slotStart: '10:00' });
    expect(buildBookingActivityDeepLinkForStage(booking, 0)).toContain('booking-detail');
    expect(buildBookingActivityDeepLinkForStage(booking, 1)).toBe(
      'realbarber://screens/booking-detail?id=res-3&openNavigate=1'
    );
    expect(buildBookingActivityDeepLinkForStage(booking, 3)).toBe('realbarber://inspirace');
    expect(buildBookingActivityDeepLinkForStage(booking, BOOKING_REVIEW_STAGE)).toContain('/screens/review');
  });
});
