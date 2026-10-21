import { describe, expect, it, vi } from 'vitest';

import {
  LEGACY_RESERVATION_DETAIL_ROUTE,
  RESERVATION_DETAIL_ROUTE,
  buildReservationDetailDeepLink,
  buildReservationDetailHref,
  normalizePushDeepLinkPath,
  resolveDirectPushNavigationHref,
  resolveReservationIdFromPushData,
} from '@/utils/pushNavigation';

vi.mock('expo-router', () => ({
  router: { push: vi.fn() },
}));

describe('pushNavigation', () => {
  it('resolves reservation id from push payload', () => {
    expect(resolveReservationIdFromPushData({ reservationId: 'abc-123' })).toBe('abc-123');
    expect(resolveReservationIdFromPushData({ entityType: 'reservation', entityId: '42' })).toBe(
      '42'
    );
    expect(
      resolveReservationIdFromPushData({ entity_type: 'Reservation', entity_id: '550e8400' })
    ).toBe('550e8400');
    expect(resolveReservationIdFromPushData({ entityType: 'sale_log', entityId: '99' })).toBeNull();
  });

  it('builds in-app and deep-link routes for booking detail', () => {
    expect(RESERVATION_DETAIL_ROUTE).toBe('/screens/booking-detail');
    expect(LEGACY_RESERVATION_DETAIL_ROUTE).toBe('/screens/trip-detail');
    expect(buildReservationDetailHref('x/y')).toBe('/screens/booking-detail?id=x%2Fy');
    expect(buildReservationDetailDeepLink('x/y', { openReview: true })).toBe(
      'realbarber://screens/booking-detail?id=x%2Fy&openReview=1'
    );
    expect(buildReservationDetailDeepLink('x/y', { openNavigate: true })).toBe(
      'realbarber://screens/booking-detail?id=x%2Fy&openNavigate=1'
    );
  });

  it('prefers notificationId over legacy reservation fallback', async () => {
    const { resolveNotificationIdFromPushData } = await import('@/utils/pushNavigation');
    expect(
      resolveNotificationIdFromPushData({
        notificationId: 'notif-1',
        entityType: 'Reservation',
        entityId: 'res-1',
      })
    ).toBe('notif-1');
  });

  it('routes booking push directly to reservation detail', () => {
    expect(
      resolveDirectPushNavigationHref({
        notificationId: 'notif-1',
        eventKey: 'reservation_created',
        entityType: 'Reservation',
        entityId: 'res-1',
      })
    ).toBe('/screens/booking-detail?id=res-1');
  });

  it('routes RBC payment push directly to wallet transaction detail', () => {
    expect(
      resolveDirectPushNavigationHref({
        notificationId: 'notif-2',
        eventKey: 'rbc_deposit',
        entityType: 'RbCoinsTransaction',
        entityId: 'tx-1',
      })
    ).toBe('/screens/wallet-history?transactionId=tx-1');
  });

  it('keeps marketing push on notification history flow', () => {
    expect(
      resolveDirectPushNavigationHref({
        notificationId: 'notif-3',
        eventKey: 'marketing_campaign',
        entityType: 'Marketing',
      })
    ).toBeNull();
  });

  it('routes review push directly to booking detail with review sheet', () => {
    expect(
      resolveDirectPushNavigationHref({
        eventKey: 'review_requested',
        entityType: 'Reservation',
        entityId: 'res-9',
      })
    ).toBe('/screens/booking-detail?id=res-9&openReview=1');
  });

  it('routes visit plan T−7 push to calendar (not booking detail)', () => {
    expect(
      resolveDirectPushNavigationHref({
        notificationId: 'uuid-logu',
        eventKey: 'visit_plan_reminder_t7',
        event_key: 'visit_plan_reminder_t7',
        entityType: 'visit_plan',
        entityId: '',
        source: 'template',
        phase: 't7',
        nextTargetVisitDate: '2026-10-22',
        deeplink: '/screens/visit-plan-calendar',
      })
    ).toBe('/screens/visit-plan-calendar?date=2026-10-22');
  });

  it('routes visit plan T−3 via snake_case aliases', () => {
    expect(
      resolveDirectPushNavigationHref({
        event_key: 'visit_plan_reminder_t3',
        entity_type: 'visit_plan',
        next_target_visit_date: '2026-10-25',
      })
    ).toBe('/screens/visit-plan-calendar?date=2026-10-25');
  });

  it('normalizes CRM realbarber deeplink paths', () => {
    expect(normalizePushDeepLinkPath('/screens/visit-plan-calendar')).toBe(
      '/screens/visit-plan-calendar'
    );
    expect(normalizePushDeepLinkPath('realbarber://screens/visit-plan-calendar')).toBe(
      '/screens/visit-plan-calendar'
    );
    expect(normalizePushDeepLinkPath('realbarber:///screens/visit-plan-calendar')).toBe(
      '/screens/visit-plan-calendar'
    );
  });
});
