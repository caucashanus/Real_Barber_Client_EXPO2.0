import { WEB_BFF_ORIGIN } from '@/constants/bookingMonitor';

import type { PhoneCallFeedbackPayload } from './types';

function omitNullish(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

/** Fire-and-forget → web `/api/phone-call-feedback`. */
export async function postPhoneCallFeedback(payload: PhoneCallFeedbackPayload): Promise<void> {
  const url = `${WEB_BFF_ORIGIN}/api/phone-call-feedback`;
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
    // Monitoring must not block UX.
  }
}
