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
import { fetchCrm } from './http';

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

export async function registerPushToken(
  apiToken: string,
  payload: RegisterPushTokenPayload
): Promise<void> {
  await fetchCrm<void>('/api/client/push/register-token', {
    method: 'POST',
    apiToken,
    body: payload,
  });
}

export async function unregisterPushToken(apiToken: string, token: string): Promise<void> {
  await fetchCrm<void>('/api/client/push/unregister-token', {
    method: 'POST',
    apiToken,
    body: { token },
  });
}
