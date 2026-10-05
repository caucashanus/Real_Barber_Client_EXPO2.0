import { describe, expect, it, vi } from 'vitest';

import type { CrmClient } from '@/api/auth';
import type { ClientMe } from '@/api/client';
import { resolveClientAfterStorageLoad } from '@/utils/resolveClientAfterStorageLoad';

const stored: CrmClient = {
  id: '1',
  name: 'Jan',
  email: '',
  phone: '+420777123456',
  avatarUrl: null,
  address: '',
  whatsapp: null,
  birthday: null,
  lastVisit: null,
  createdAt: '',
  updatedAt: '',
};

const meWithEmail = (email: string): ClientMe => ({
  id: '1',
  name: 'Jan',
  firstName: 'Jan',
  lastName: null,
  email,
  phone: '+420777123456',
  avatarUrl: null,
  bio: null,
  displayName: null,
  address: null,
  city: null,
  zip: null,
  country: null,
  whatsapp: null,
  birthday: null,
  lastVisit: null,
  createdAt: '',
  updatedAt: '',
  customerStatus: null,
});

describe('resolveClientAfterStorageLoad', () => {
  it('returns stored client when email already valid', async () => {
    const withEmail = { ...stored, email: 'jan@example.com' };
    const fetchClientMe = vi.fn();
    const result = await resolveClientAfterStorageLoad({
      storedClient: withEmail,
      apiToken: 'tok',
      fetchClientMe,
      clientMeToCrm: (me) => ({ ...stored, email: me.email }),
    });
    expect(result).toBe(withEmail);
    expect(fetchClientMe).not.toHaveBeenCalled();
  });

  it('uses /me when CRM has email', async () => {
    const fetchClientMe = vi.fn().mockResolvedValue(meWithEmail('crm@example.com'));
    const result = await resolveClientAfterStorageLoad({
      storedClient: stored,
      apiToken: 'tok',
      fetchClientMe,
      clientMeToCrm: (me) => ({ ...stored, email: me.email }),
    });
    expect(fetchClientMe).toHaveBeenCalledWith('tok');
    expect(result.email).toBe('crm@example.com');
  });

  it('keeps cache when /me fails', async () => {
    const fetchClientMe = vi.fn().mockRejectedValue(new Error('offline'));
    const result = await resolveClientAfterStorageLoad({
      storedClient: stored,
      apiToken: 'tok',
      fetchClientMe,
      clientMeToCrm: (me) => ({ ...stored, email: me.email }),
    });
    expect(result).toBe(stored);
  });
});
