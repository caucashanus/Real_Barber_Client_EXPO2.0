import { router } from 'expo-router';

/** Cesta k detailu rezervace (booking) — odpovídá `app/screens/trip-detail.tsx` + `useLocalSearchParams` `id`. */
export const RESERVATION_DETAIL_ROUTE = '/screens/trip-detail';

/**
 * Deep link (scheme z `app.json`: `realbarber`):
 * `realbarber:///screens/trip-detail?id=<reservationId>`
 */
export function buildReservationDetailHref(reservationId: string): string {
  return `${RESERVATION_DETAIL_ROUTE}?id=${encodeURIComponent(reservationId)}`;
}

/**
 * Deep link pro Live Activity / widget tap (scheme `realbarber`):
 * `realbarber://screens/trip-detail?id=<reservationId>&openReview=1`
 */
export function buildReservationDetailDeepLink(
  reservationId: string,
  options?: { openReview?: boolean }
): string {
  const id = encodeURIComponent(reservationId);
  const openReview = options?.openReview ? '&openReview=1' : '';
  return `realbarber://screens/trip-detail?id=${id}${openReview}`;
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

/**
 * Zpracuje data z push (Expo `content.data`).
 * 1) Legacy: `deeplink` | `deepLink` | `route`
 * 2) Rezervace: `reservationId` nebo (`entityType === reservation` + `entityId`)
 * Při chybějícím / neplatném ID se nevolá navigace (žádný pád).
 */
export function openFromPushNotificationData(
  data: Record<string, unknown> | undefined,
  options?: OpenFromPushOptions
): void {
  if (!data) return;

  const run = () => {
    const legacy = legacyDeepLinkHref(data);
    if (legacy) {
      safePush(legacy);
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
