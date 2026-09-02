/**
 * iOS Live Activity (ActivityKit) — registrace APNs tokenů pro CRM remote push.
 *
 * C1 POST /api/client/live-activity/activitykit-push-token
 * C2 POST /api/client/live-activity/push-to-start-token
 * C3 POST /api/client/live-activity/unregister-token
 */
import { fetchCrm } from './http';

export interface ActivityKitPushTokenPayload {
  bookingId: string;
  activityId: string;
  pushToken: string;
  deviceId?: string;
  appVersion?: string;
}

export interface PushToStartTokenPayload {
  pushToken: string;
  deviceId?: string;
  appVersion?: string;
}

export interface UnregisterLiveActivityTokenPayload {
  activityId?: string;
  pushToStart?: boolean;
  deviceId?: string;
}

export interface LiveActivityTokenResponse {
  ok: boolean;
}

export async function registerActivityKitPushToken(
  apiToken: string,
  payload: ActivityKitPushTokenPayload
): Promise<void> {
  await fetchCrm<LiveActivityTokenResponse>('/api/client/live-activity/activitykit-push-token', {
    method: 'POST',
    apiToken,
    body: payload,
  });
}

export async function registerPushToStartToken(
  apiToken: string,
  payload: PushToStartTokenPayload
): Promise<void> {
  await fetchCrm<LiveActivityTokenResponse>('/api/client/live-activity/push-to-start-token', {
    method: 'POST',
    apiToken,
    body: payload,
  });
}

export async function unregisterLiveActivityToken(
  apiToken: string,
  payload: UnregisterLiveActivityTokenPayload
): Promise<void> {
  await fetchCrm<LiveActivityTokenResponse>('/api/client/live-activity/unregister-token', {
    method: 'POST',
    apiToken,
    body: payload,
  });
}
