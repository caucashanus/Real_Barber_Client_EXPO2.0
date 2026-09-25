import { describe, expect, it } from 'vitest';

import { parseMobileCompatibilityPolicy } from '@/api/mobileCompatibility';
import { shouldBlockNativeAppForPolicy } from '@/utils/mobileCompatibilityGate';

describe('parseMobileCompatibilityPolicy', () => {
  it('parses valid CRM payload', () => {
    const policy = parseMobileCompatibilityPolicy({
      minNativeVersion: { ios: '2.2.0', android: '2.2.0' },
      storeUrls: {
        ios: 'https://apps.apple.com/app/id6760221388',
        android: 'https://play.google.com/store/apps/details?id=com.realbarber.client',
      },
      updatedAt: '2026-09-25T13:05:55.539Z',
    });
    expect(policy?.minNativeVersion.ios).toBe('2.2.0');
  });

  it('rejects invalid semver', () => {
    expect(
      parseMobileCompatibilityPolicy({
        minNativeVersion: { ios: '2.2', android: '2.2.0' },
        storeUrls: { ios: 'https://a', android: 'https://b' },
        updatedAt: 'x',
      })
    ).toBeNull();
  });
});

describe('shouldBlockNativeAppForPolicy', () => {
  const policy = {
    minNativeVersion: { ios: '2.2.0', android: '2.2.0' },
    storeUrls: { ios: 'https://a', android: 'https://b' },
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('blocks older installed version', () => {
    expect(
      shouldBlockNativeAppForPolicy({
        installedVersion: '2.1.9',
        platform: 'ios',
        policy,
      })
    ).toBe(true);
  });

  it('allows current or newer', () => {
    expect(
      shouldBlockNativeAppForPolicy({
        installedVersion: '2.2.6',
        platform: 'android',
        policy,
      })
    ).toBe(false);
  });
});
