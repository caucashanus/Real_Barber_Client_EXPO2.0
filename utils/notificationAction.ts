import type { IconName } from '@/components/Icon';
import type { TranslationKey } from '@/locales';

export type NotificationUiCategory =
  | 'all'
  | 'booking'
  | 'cancellation'
  | 'payment'
  | 'review'
  | 'marketing';

export type NotificationDetailActionKind =
  | 'none'
  | 'booking'
  | 'booking_review'
  | 'wallet_transaction';

export interface NotificationSemanticFields {
  eventKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  source?: string | null;
}

export interface NotificationDetailAction {
  kind: NotificationDetailActionKind;
}

const RESERVATION_EVENT_KEYS = new Set([
  'reservation_created',
  'reservation_cancelled',
  'reservation_rescheduled',
  'reservation_confirmed',
]);

const RBC_EVENT_KEYS = new Set([
  'rbc_deposit',
  'rbc_withdrawal',
  'rbc_transfer_received',
  'rbc_transfer_sent',
  'rbc_cashback',
]);

export function normalizeEventKey(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function normalizeEntityType(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function resolveNotificationUiCategory(
  fields: NotificationSemanticFields
): NotificationUiCategory {
  const eventKey = normalizeEventKey(fields.eventKey);
  const entityType = normalizeEntityType(fields.entityType);
  const source = normalizeEventKey(fields.source);

  if (eventKey === 'marketing_campaign' || entityType === 'marketing' || source === 'marketing') {
    return 'marketing';
  }
  if (eventKey === 'review_requested') {
    return 'review';
  }
  if (eventKey === 'reservation_cancelled' || eventKey.includes('cancelled')) {
    return 'cancellation';
  }
  if (
    RBC_EVENT_KEYS.has(eventKey) ||
    eventKey === 'payment_confirmed' ||
    entityType === 'salelog' ||
    entityType === 'rbcoinstransaction'
  ) {
    return 'payment';
  }
  if (
    RESERVATION_EVENT_KEYS.has(eventKey) ||
    entityType === 'reservation' ||
    eventKey.startsWith('reservation_')
  ) {
    return 'booking';
  }
  return 'all';
}

export function resolveNotificationDetailAction(
  fields: NotificationSemanticFields
): NotificationDetailAction {
  const eventKey = normalizeEventKey(fields.eventKey);
  const entityType = normalizeEntityType(fields.entityType);
  const entityId = fields.entityId?.trim();

  if (!entityId) return { kind: 'none' };

  if (eventKey === 'review_requested') {
    return { kind: 'booking_review' };
  }

  if (entityType === 'rbcoinstransaction' || RBC_EVENT_KEYS.has(eventKey)) {
    return { kind: 'wallet_transaction' };
  }

  if (
    entityType === 'reservation' ||
    RESERVATION_EVENT_KEYS.has(eventKey) ||
    eventKey.startsWith('reservation_')
  ) {
    return { kind: 'booking' };
  }

  return { kind: 'none' };
}

export function buildNotificationActionHref(
  action: NotificationDetailAction,
  entityId: string
): string | null {
  const id = entityId.trim();
  if (!id || action.kind === 'none') return null;

  switch (action.kind) {
    case 'booking':
      return `/screens/booking-detail?id=${encodeURIComponent(id)}`;
    case 'booking_review':
      return `/screens/booking-detail?id=${encodeURIComponent(id)}&openReview=1`;
    case 'wallet_transaction':
      return `/screens/wallet-history?transactionId=${encodeURIComponent(id)}`;
    default:
      return null;
  }
}

export function getNotificationActionLabelKey(
  action: NotificationDetailAction
): TranslationKey | null {
  switch (action.kind) {
    case 'booking':
      return 'reservationsViewBooking';
    case 'booking_review':
      return 'notificationsLeaveReview';
    case 'wallet_transaction':
      return 'notificationsViewTransaction';
    default:
      return null;
  }
}

export function iconForNotificationCategory(category: NotificationUiCategory): IconName {
  switch (category) {
    case 'booking':
      return 'Calendar';
    case 'cancellation':
      return 'X';
    case 'payment':
      return 'CreditCard';
    case 'review':
      return 'Star';
    case 'marketing':
      return 'Bell';
    default:
      return 'Bell';
  }
}

/** UI list filter type used on notifications screen. */
export type NotificationListFilter = 'all' | 'booking' | 'payment';

export function matchesNotificationListFilter(
  category: NotificationUiCategory,
  filter: NotificationListFilter
): boolean {
  if (filter === 'all') return true;
  if (filter === 'booking') {
    return category === 'booking' || category === 'cancellation' || category === 'review';
  }
  if (filter === 'payment') {
    return category === 'payment';
  }
  return true;
}
