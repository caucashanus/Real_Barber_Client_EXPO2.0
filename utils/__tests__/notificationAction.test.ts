import { describe, expect, it } from 'vitest';

import {
  buildNotificationActionHref,
  getNotificationActionLabelKey,
  matchesNotificationListFilter,
  resolveNotificationDetailAction,
  resolveNotificationUiCategory,
} from '@/utils/notificationAction';

describe('notificationAction', () => {
  it('maps reservation events to booking category and action', () => {
    const fields = {
      eventKey: 'reservation_created',
      entityType: 'Reservation',
      entityId: 'res-1',
      source: 'template',
    };
    expect(resolveNotificationUiCategory(fields)).toBe('booking');
    expect(resolveNotificationDetailAction(fields)).toEqual({ kind: 'booking' });
    expect(buildNotificationActionHref({ kind: 'booking' }, 'res-1')).toBe(
      '/screens/booking-detail?id=res-1'
    );
  });

  it('maps review_requested to review category and booking_review action', () => {
    const fields = {
      eventKey: 'review_requested',
      entityType: 'Reservation',
      entityId: 'res-2',
      source: 'template',
    };
    expect(resolveNotificationUiCategory(fields)).toBe('review');
    expect(resolveNotificationDetailAction(fields)).toEqual({ kind: 'booking_review' });
    expect(buildNotificationActionHref({ kind: 'booking_review' }, 'res-2')).toBe(
      '/screens/booking-detail?id=res-2&openReview=1'
    );
  });

  it('maps RBC events to payment category and wallet_transaction action', () => {
    const fields = {
      eventKey: 'rbc_deposit',
      entityType: 'RbCoinsTransaction',
      entityId: 'tx-1',
      source: 'template',
    };
    expect(resolveNotificationUiCategory(fields)).toBe('payment');
    expect(resolveNotificationDetailAction(fields)).toEqual({ kind: 'wallet_transaction' });
    expect(buildNotificationActionHref({ kind: 'wallet_transaction' }, 'tx-1')).toBe(
      '/screens/wallet-history?transactionId=tx-1'
    );
  });

  it('maps marketing without entity to marketing category and no action', () => {
    const fields = {
      eventKey: 'marketing_campaign',
      entityType: 'Marketing',
      entityId: null,
      source: 'marketing',
    };
    expect(resolveNotificationUiCategory(fields)).toBe('marketing');
    expect(resolveNotificationDetailAction(fields)).toEqual({ kind: 'none' });
  });

  it('maps payment_confirmed to payment filter but no detail action without RBC screen', () => {
    const fields = {
      eventKey: 'payment_confirmed',
      entityType: 'SaleLog',
      entityId: 'sale-1',
      source: 'template',
    };
    expect(resolveNotificationUiCategory(fields)).toBe('payment');
    expect(resolveNotificationDetailAction(fields)).toEqual({ kind: 'none' });
    expect(matchesNotificationListFilter('payment', 'payment')).toBe(true);
  });

  it('returns label keys for supported actions', () => {
    expect(getNotificationActionLabelKey({ kind: 'booking' })).toBe('reservationsViewBooking');
    expect(getNotificationActionLabelKey({ kind: 'booking_review' })).toBe(
      'notificationsLeaveReview'
    );
    expect(getNotificationActionLabelKey({ kind: 'wallet_transaction' })).toBe(
      'notificationsViewTransaction'
    );
    expect(getNotificationActionLabelKey({ kind: 'none' })).toBeNull();
  });
});
