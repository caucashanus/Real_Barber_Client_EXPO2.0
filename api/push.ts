/**
 * Push (Expo) – vše, co mobil potřebuje pro registraci / odregistrování tokenu (Bearer `apiToken`).
 *
 * **POST `/api/client/push/register-token`**
 * Body (JSON): `token`, `platform` (např. `ios` | `android`), volitelně `appVersion`, `deviceId`, `locale`, `timezone`.
 * Odpovědi: 200 + `{ message, status }`, 400 invalid token/platform, 401, 500.
 *
 * **POST `/api/client/push/unregister-token`**
 * Body (JSON): `token`.
 * Odpovědi: 200 + `{ message, status }`, 400 missing token, 401, 404 token not found, 500.
 *
 * Volání: po loginu / při startu / po změně Expo tokenu (`registerPushToken`), při logoutu (`unregisterPushToken`).
 */
const CRM_BASE = 'https://crm.xrb.cz';

/** Tělo `POST /api/client/push/register-token` (application/json). */
export interface RegisterPushTokenPayload {
  /** Expo push token */
  token: string;
  /** Např. `ios` nebo `android` (API: string) */
  platform: string;
  appVersion?: string;
  deviceId?: string;
  locale?: string;
  timezone?: string;
}

/** Úspěšná odpověď obou endpointů (200). */
export interface PushTokenMutationResponse {
  message: string;
  status: number;
}

async function parseErrorBody(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Push API error ${res.status}`;
  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    return json.message ?? json.error ?? text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

async function postJson(apiToken: string, path: string, body: unknown): Promise<void> {
  const res = await fetch(`${CRM_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const detail = await parseErrorBody(res);
  throw new Error(detail || `Push API error ${res.status}`);
}

export async function registerPushToken(
  apiToken: string,
  payload: RegisterPushTokenPayload
): Promise<void> {
  await postJson(apiToken, '/api/client/push/register-token', payload);
}

export async function unregisterPushToken(apiToken: string, token: string): Promise<void> {
  await postJson(apiToken, '/api/client/push/unregister-token', { token });
}
