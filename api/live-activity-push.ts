/**
 * Registrace ActivityKit push tokenu u CRM — server pak může posílat APNs `liveactivity` update/end.
 *
 * **POST `/api/client/live-activity/activitykit-push-token`**
 * Body (JSON): `bookingId`, `activityId` (ActivityKit id z appky), `pushToken` (hex řetězec z `rbLiveActivityWaitForPushToken`).
 * Bearer: stejný `apiToken` jako ostatní client API.
 *
 * Backend musí token uložit vázaný na klienta + rezervaci a použít ho v HTTP/2 požadavku na APNs
 * (`apns-push-type: liveactivity`, `aps.event` = `update` | `end`, `content-state` shodné s `RBReservationAttributes.ContentState`).
 *
 * Dokumentace: https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications
 */
const CRM_BASE = 'https://crm.xrb.cz';

export interface RegisterActivityKitPushTokenBody {
  bookingId: string;
  activityId: string;
  pushToken: string;
}

async function parseErrorBody(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Live Activity push API error ${res.status}`;
  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    return json.message ?? json.error ?? text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

export async function registerActivityKitPushToken(
  apiToken: string,
  body: RegisterActivityKitPushTokenBody
): Promise<void> {
  const res = await fetch(`${CRM_BASE}/api/client/live-activity/activitykit-push-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const detail = await parseErrorBody(res);
  throw new Error(detail || `Live Activity push API error ${res.status}`);
}
