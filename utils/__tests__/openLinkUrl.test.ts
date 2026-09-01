import { describe, expect, it } from 'vitest';

import { isNativeExternalAppLink } from '@/lib/linking/nativeExternalAppLinks';

describe('isNativeExternalAppLink', () => {
  it('detects Google Maps and Waze https links', () => {
    expect(
      isNativeExternalAppLink('https://www.google.com/maps/search/?api=1&query=Praha')
    ).toBe(true);
    expect(isNativeExternalAppLink('https://waze.com/ul?q=Praha&navigate=yes')).toBe(true);
    expect(isNativeExternalAppLink('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(isNativeExternalAppLink('https://maps.apple.com/?address=Praha')).toBe(true);
  });

  it('ignores regular web pages', () => {
    expect(isNativeExternalAppLink('https://realbarber.cz/branches/modrany/')).toBe(false);
    expect(isNativeExternalAppLink('https://example.com/maps-fake')).toBe(false);
  });
});
