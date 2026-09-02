import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  registerActivityKitPushToken,
  registerPushToStartToken,
  unregisterLiveActivityToken,
} from '@/api/liveActivityPush';

const fetchCrmMock = vi.fn();

vi.mock('@/api/http', () => ({
  fetchCrm: (...args: unknown[]) => fetchCrmMock(...args),
}));

describe('liveActivityPush API', () => {
  beforeEach(() => {
    fetchCrmMock.mockReset();
    fetchCrmMock.mockResolvedValue({ ok: true });
  });

  it('registers activity kit token (C1)', async () => {
    await registerActivityKitPushToken('token-1', {
      bookingId: 'booking-1',
      activityId: 'activity-1',
      pushToken: 'abcd1234',
      deviceId: 'iphone-1',
      appVersion: '2.0.3',
    });

    expect(fetchCrmMock).toHaveBeenCalledWith('/api/client/live-activity/activitykit-push-token', {
      method: 'POST',
      apiToken: 'token-1',
      body: {
        bookingId: 'booking-1',
        activityId: 'activity-1',
        pushToken: 'abcd1234',
        deviceId: 'iphone-1',
        appVersion: '2.0.3',
      },
    });
  });

  it('registers push-to-start token (C2)', async () => {
    await registerPushToStartToken('token-1', {
      pushToken: 'ef567890',
      deviceId: 'iphone-1',
      appVersion: '2.0.3',
    });

    expect(fetchCrmMock).toHaveBeenCalledWith('/api/client/live-activity/push-to-start-token', {
      method: 'POST',
      apiToken: 'token-1',
      body: {
        pushToken: 'ef567890',
        deviceId: 'iphone-1',
        appVersion: '2.0.3',
      },
    });
  });

  it('unregisters tokens (C3)', async () => {
    await unregisterLiveActivityToken('token-1', {
      activityId: 'activity-1',
      pushToStart: true,
      deviceId: 'iphone-1',
    });

    expect(fetchCrmMock).toHaveBeenCalledWith('/api/client/live-activity/unregister-token', {
      method: 'POST',
      apiToken: 'token-1',
      body: {
        activityId: 'activity-1',
        pushToStart: true,
        deviceId: 'iphone-1',
      },
    });
  });
});
