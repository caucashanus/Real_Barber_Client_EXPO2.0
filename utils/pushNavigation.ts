import { router } from 'expo-router';

import {
  buildNotificationActionHref,
  resolveNotificationDetailAction,
  resolveNotificationUiCategory,
  type NotificationSemanticFields,
} from '@/utils/notificationAction';
import { setPendingNotificationOpen } from '@/utils/pendingNotificationOpen';

/** Cesta k detailu rezervace — `app/screens/booking-detail.tsx` + param `id`. */
export const RESERVATION_DETAIL_ROUTE = '/screens/booking-detail';

/** Stará route kvůli push / deep linkům z CRM (viz `app/screens/trip-detail.tsx` redirect). */
export const LEGACY_RESERVATION_DETAIL_ROUTE = '/screens/trip-detail';

/**
 * Deep link (scheme z `app.json`: `realbarber`):
 * `realbarber:///screens/booking-detail?id=<reservationId>`
 */
export function buildReservationDetailHref(reservationId: string): string {
  return `${RESERVATION_DETAIL_ROUTE}?id=${encodeURIComponent(reservationId)}`;
}

/**
 * Deep link pro widget tap (scheme `realbarber`):
 * `realbarber://screens/booking-detail?id=<reservationId>&openReview=1`
 */
export function buildReservationDetailDeepLink(
  reservationId: string,
  options?: { openReview?: boolean }
): string {
  const id = encodeURIComponent(reservationId);
  const openReview = options?.openReview ? '&openReview=1' : '';
  return `realbarber://screens/booking-detail?id=${id}${openReview}`;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** Akceptuje string nebo číslo z JSON payloadu. */
export function parseIdValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return asTrimmedString(value);
}

function normalizeEntityType(value: unknown): string | null {
  const s = asTrimmedString(value);
  return s ? s.toLowerCase() : null;
}

function resolveQuickReviewBookingHref(data: Record<string, unknown>): string | null {
  const token = asTrimmedString(data.quickReviewToken);
  if (!token) return null;
  const reservationId = resolveReservationIdFromPushData(data);
  if (!reservationId) return null;
  return `${buildReservationDetailHref(reservationId)}&openReview=1`;
}

/**
 * Vrátí ID rezervace pro navigaci: nejdřív `reservationId`, jinak při `entityType === "reservation"` použije `entityId`.
 */
export function resolveReservationIdFromPushData(
  data: Record<string, unknown> | undefined
): string | null {
  if (!data) return null;

  const fromReservationId = parseIdValue(data.reservationId);
  if (fromReservationId) return fromReservationId;

  const entityType = normalizeEntityType(data.entityType);
  if (entityType === 'reservation') {
    const fromEntity = parseIdValue(data.entityId);
    if (fromEntity) return fromEntity;
  }

  return null;
}

function resolveSemanticFieldsFromPushData(
  data: Record<string, unknown>
): NotificationSemanticFields {
  return {
    eventKey:
      asTrimmedString(data.eventKey) ??
      asTrimmedString(data.event_key) ??
      asTrimmedString(data.type),
    entityType: asTrimmedString(data.entityType) ?? asTrimmedString(data.entity_type),
    entityId: parseIdValue(data.entityId) ?? parseIdValue(data.entity_id),
    source: asTrimmedString(data.source),
  };
}

/**
 * Direct target for push tap by category:
 * - booking / cancellation / review / payment (RBC) → entity screen
 * - marketing / unknown → null (open notification history + ActionSheet)
 */
export function resolveDirectPushNavigationHref(
  data: Record<string, unknown> | undefined
): string | null {
  if (!data) return null;

  const fields = resolveSemanticFieldsFromPushData(data);
  const category = resolveNotificationUiCategory(fields);

  if (category === 'marketing' || category === 'all') return null;

  const action = resolveNotificationDetailAction(fields);
  const hrefFromAction = buildNotificationActionHref(action, fields.entityId ?? '');
  if (hrefFromAction) return hrefFromAction;

  if (category === 'booking' || category === 'cancellation') {
    const reservationId = resolveReservationIdFromPushData(data);
    if (reservationId) return buildReservationDetailHref(reservationId);
  }

  if (category === 'review') {
    const reservationId = resolveReservationIdFromPushData(data);
    if (reservationId) return `${buildReservationDetailHref(reservationId)}&openReview=1`;
  }

  return null;
}

function legacyDeepLinkHref(data: Record<string, unknown>): string | null {
  const raw =
    asTrimmedString(data.deeplink) ?? asTrimmedString(data.deepLink) ?? asTrimmedString(data.route);
  return raw;
}

/** Bezpečná navigace — bez pádu při prázdném href. */
function safePush(href: string): void {
  const trimmed = href.trim();
  if (!trimmed) return;
  try {
    router.push(trimmed as never);
  } catch (e) {
    if (__DEV__) {
      console.warn('[push] router.push failed', e);
    }
  }
}

export type OpenFromPushOptions = {
  /** Cold start: počkat na mount navigátoru (viz `getLastNotificationResponseAsync`). */
  deferMs?: number;
};

/** ID záznamu v historii notifikací z push payloadu. */
export function resolveNotificationIdFromPushData(
  data: Record<string, unknown> | undefined
): string | null {
  if (!data) return null;

  const explicit =
    parseIdValue(data.notificationId) ??
    parseIdValue(data.notification_id) ??
    parseIdValue(data.historyId) ??
    parseIdValue(data.history_id);

  if (explicit) return explicit;

  const screen = asTrimmedString(data.screen)?.toLowerCase();
  if (
    screen === 'notifications' ||
    screen === 'notification' ||
    screen === 'notification_history' ||
    screen === 'notificationhistory'
  ) {
    return parseIdValue(data.id);
  }

  const reservationId = resolveReservationIdFromPushData(data);
  const entityId = parseIdValue(data.entityId);
  const genericId = parseIdValue(data.id);
  if (genericId && genericId !== reservationId && genericId !== entityId) {
    return genericId;
  }

  return null;
}

export function buildNotificationHistoryHref(notificationId: string): string {
  return `/screens/notifications?openId=${encodeURIComponent(notificationId)}`;
}

export function openNotificationHistoryFromPush(
  notificationId: string,
  options?: OpenFromPushOptions
): void {
  setPendingNotificationOpen(notificationId);
  const href = buildNotificationHistoryHref(notificationId);

  const run = () => safePush(href);
  const ms = options?.deferMs ?? 0;
  if (ms > 0) {
    setTimeout(run, ms);
    return;
  }
  requestAnimationFrame(run);
}

/**
 * Zpracuje data z push (Expo `content.data`).
 * 1) Rezervace / platby (RBC) → přímo na detail entity
 * 2) Marketing / neznámé → historie notifikací + ActionSheet (`notificationId`)
 * 3) Legacy: `deeplink` | `deepLink` | `route`
 * 4) Rezervace fallback: `reservationId` nebo (`entityType === reservation` + `entityId`)
 */
export function openFromPushNotificationData(
  data: Record<string, unknown> | undefined,
  options?: OpenFromPushOptions
): void {
  if (!data) return;

  const SCREEN_MAP: Record<string, string> = {
    wallet: '/wallet',
    home: '/real-barber',
    bookings: '/bookings',
    trips: '/bookings',
    profile: '/profile',
  };

  const run = () => {
    const directHref = resolveDirectPushNavigationHref(data);
    if (directHref) {
      safePush(directHref);
      return;
    }

    const notificationId = resolveNotificationIdFromPushData(data);
    if (notificationId) {
      openNotificationHistoryFromPush(notificationId, options);
      return;
    }

    const quickReviewHref = resolveQuickReviewBookingHref(data);
    if (quickReviewHref) {
      safePush(quickReviewHref);
      return;
    }

    const legacy = legacyDeepLinkHref(data);
    if (legacy) {
      safePush(legacy);
      return;
    }

    const screen = asTrimmedString(data.screen);
    if (screen && SCREEN_MAP[screen]) {
      safePush(SCREEN_MAP[screen]);
      return;
    }

    const reservationId = resolveReservationIdFromPushData(data);
    if (!reservationId) {
      if (__DEV__) {
        console.log('[push] no reservation route in payload (missing id / entity)');
      }
      return;
    }

    safePush(buildReservationDetailHref(reservationId));
  };

  const ms = options?.deferMs ?? 0;
  if (ms > 0) {
    setTimeout(run, ms);
    return;
  }
  requestAnimationFrame(run);
}
