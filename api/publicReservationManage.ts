import type { BookingManage } from '@/api/bookings';
import { CRM_BASE } from '@/api/http';
import {
  parseManagedReservationEnvelope,
  type PublicManagedReservation,
} from '@/utils/reservationManageParse';

export const RESERVATION_MANAGE_SECRET_HEADER = 'X-Reservation-Secret';

export type ManageApiErrorCode =
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'gone'
  | 'rate_limit'
  | 'unknown';

export type ManagedReservationResult =
  | { ok: true; reservation: PublicManagedReservation; message?: string }
  | {
      ok: false;
      status: number;
      error: ManageApiErrorCode;
      crmError?: string;
      message?: string;
    };

function mapErrorStatus(status: number): ManageApiErrorCode {
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 410) return 'gone';
  if (status === 429) return 'rate_limit';
  return 'unknown';
}

function secretHeaders(secret: string): HeadersInit {
  return {
    Accept: 'application/json',
    [RESERVATION_MANAGE_SECRET_HEADER]: secret.trim(),
  };
}

async function parseManageResponse(res: Response): Promise<ManagedReservationResult> {
  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }

  if (!res.ok) {
    const body = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
    const message = typeof body?.message === 'string' ? body.message : undefined;
    const crmError = typeof body?.error === 'string' ? body.error.trim() : undefined;
    return {
      ok: false,
      status: res.status,
      error: mapErrorStatus(res.status),
      crmError: crmError || undefined,
      message,
    };
  }

  const parsed = parseManagedReservationEnvelope(json);
  if (!parsed) {
    return { ok: false, status: res.status, error: 'unknown' };
  }
  return {
    ok: true,
    reservation: parsed.reservation,
    message: parsed.message,
  };
}

function apiUrl(reservationId: string, subPath?: 'confirm'): string {
  const id = encodeURIComponent(reservationId.trim());
  const suffix = subPath ? `/${subPath}` : '';
  return `${CRM_BASE}/api/public/reservations/${id}${suffix}`;
}

/** GET /api/public/reservations/{id} */
export async function fetchPublicManagedReservation(
  reservationId: string,
  secret: string
): Promise<ManagedReservationResult> {
  const res = await fetch(apiUrl(reservationId), {
    method: 'GET',
    headers: secretHeaders(secret),
  });
  return parseManageResponse(res);
}

/** POST /api/public/reservations/{id}/confirm */
export async function confirmPublicManagedReservation(
  reservationId: string,
  secret: string
): Promise<ManagedReservationResult> {
  const res = await fetch(apiUrl(reservationId, 'confirm'), {
    method: 'POST',
    headers: secretHeaders(secret),
  });
  return parseManageResponse(res);
}

/** DELETE /api/public/reservations/{id} */
export async function cancelPublicManagedReservation(
  reservationId: string,
  secret: string,
  reason?: string
): Promise<ManagedReservationResult> {
  const res = await fetch(apiUrl(reservationId), {
    method: 'DELETE',
    headers: {
      ...secretHeaders(secret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
  });
  return parseManageResponse(res);
}

/** PATCH /api/public/reservations/{id} — přesun termínu (guest magic link). */
export async function patchPublicManagedReservation(
  reservationId: string,
  secret: string,
  body: {
    date?: string;
    slotStart?: string;
    slotEnd?: string;
    reason?: string;
  }
): Promise<ManagedReservationResult> {
  const res = await fetch(apiUrl(reservationId), {
    method: 'PATCH',
    headers: {
      ...secretHeaders(secret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseManageResponse(res);
}

export type { PublicManagedReservation, BookingManage };
