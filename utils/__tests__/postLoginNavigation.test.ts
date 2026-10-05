import { describe, expect, it } from 'vitest';

import type { CrmClient } from '@/api/auth';
import { LOGIN_COMPLETE_EMAIL_PATH } from '@/constants/authRoutes';
import { POST_LOGIN_HOME_PATH, resolvePostLoginHref } from '@/utils/postLoginNavigation';

const baseClient: CrmClient = {
  id: '1',
  name: 'Test',
  email: 'a@b.cz',
  phone: '+420777123456',
  avatarUrl: null,
  address: '',
  whatsapp: null,
  birthday: null,
  lastVisit: null,
  createdAt: '',
  updatedAt: '',
};

describe('resolvePostLoginHref', () => {
  it('routes to home when email is valid', () => {
    expect(resolvePostLoginHref(baseClient)).toBe(POST_LOGIN_HOME_PATH);
  });

  it('routes to complete-email when email missing', () => {
    expect(resolvePostLoginHref({ ...baseClient, email: '' })).toBe(LOGIN_COMPLETE_EMAIL_PATH);
  });
});
