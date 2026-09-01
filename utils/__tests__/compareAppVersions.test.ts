import { describe, expect, it } from 'vitest';

import { compareAppVersions, isAppVersionAtLeast } from '@/utils/compareAppVersions';

describe('compareAppVersions', () => {
  it('compares semver parts', () => {
    expect(compareAppVersions('2.0.2', '2.0.2')).toBe(0);
    expect(compareAppVersions('2.0.1', '2.0.2')).toBeLessThan(0);
    expect(compareAppVersions('2.1.0', '2.0.2')).toBeGreaterThan(0);
    expect(compareAppVersions('1.9.9', '2.0.2')).toBeLessThan(0);
  });

  it('checks minimum version threshold', () => {
    expect(isAppVersionAtLeast('2.0.2', '2.0.2')).toBe(true);
    expect(isAppVersionAtLeast('2.0.3', '2.0.2')).toBe(true);
    expect(isAppVersionAtLeast('2.0.1', '2.0.2')).toBe(false);
  });
});
