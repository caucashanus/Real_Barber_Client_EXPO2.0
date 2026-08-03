import { BOOKING_MONITOR_WEB_ORIGIN } from '@/constants/bookingMonitor';

import type {
  BookingMonitorEvent,
  BookingMonitorPayload,
  TrackBookingMonitorFields,
} from './types';

export function phoneForMonitor(phone: string | null | undefined): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  return raw.slice(0, 32);
}

function omitNullish(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

export async function postBookingMonitorPayload(
  payload: BookingMonitorPayload,
  _options?: { background?: boolean }
): Promise<void> {
  // Trailing slash — Next web má trailingSlash: true; bez něj Vercel vrátí 308 a RN fetch POST neprojde.
  const url = `${BOOKING_MONITOR_WEB_ORIGIN}/api/booking-monitor/`;
  const json = JSON.stringify(omitNullish(payload as unknown as Record<string, unknown>));

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: json,
      cache: 'no-store',
    });
  } catch {
    // Fire-and-forget — monitoring nesmí blokovat booking.
  }
}

export function buildBookingMonitorPayload(
  event: BookingMonitorEvent,
  entry: BookingMonitorPayload['entry'],
  sessionId: string,
  fields: TrackBookingMonitorFields | undefined,
  identity: {
    clientName: string | null;
    phone: string | null;
    userAgent: string;
  }
): BookingMonitorPayload {
  return {
    event,
    source: 'app',
    sessionId,
    entry,
    recipeId: fields?.recipeId ?? null,
    step: fields?.step ?? null,
    locale: fields?.locale ?? null,
    isLoggedIn: true,
    clientName: identity.clientName,
    phoneMasked: phoneForMonitor(identity.phone),
    branchName: fields?.branchName ?? null,
    serviceName: fields?.serviceName ?? null,
    employeeName: fields?.employeeName ?? null,
    date: fields?.date ?? null,
    slotStart: fields?.slotStart ?? null,
    slotEnd: fields?.slotEnd ?? null,
    isNewClient: fields?.isNewClient ?? null,
    userAgent: identity.userAgent,
  };
}
