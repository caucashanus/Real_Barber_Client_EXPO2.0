import { describe, expect, it } from 'vitest';

import { PROFILE_GDPR_URL, PROFILE_PRIVACY_APP_ROUTE } from '@/constants/profileContacts';
import { resolveWebPathToAppRoute } from '@/lib/linking/resolveWebPath';

describe('resolveWebPath privacy policy', () => {
  it('maps GDPR web paths to the in-app privacy screen', () => {
    expect(resolveWebPathToAppRoute('/gdpr/')).toBe(PROFILE_PRIVACY_APP_ROUTE);
    expect(resolveWebPathToAppRoute('/ochrana-osobnich-udaju/')).toBe(PROFILE_PRIVACY_APP_ROUTE);
    expect(decodeURIComponent(PROFILE_PRIVACY_APP_ROUTE)).toContain(PROFILE_GDPR_URL);
  });
});
