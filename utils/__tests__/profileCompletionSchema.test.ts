import { describe, expect, it } from 'vitest';

import type { ClientMe } from '@/api/client';
import { pickProfileCompletionStep } from '@/constants/profileCompletionSchema';

function baseClient(overrides: Partial<ClientMe> = {}): ClientMe {
  return {
    id: '1',
    name: 'Jan Novák',
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan@example.com',
    phone: '+420123456789',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    bio: null,
    displayName: null,
    address: 'Ulice 1',
    city: 'Praha',
    zip: '11000',
    country: 'CZE',
    whatsapp: null,
    birthday: '1990-05-15T00:00:00.000Z',
    lastVisit: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    customerStatus: null,
    ...overrides,
  };
}

describe('pickProfileCompletionStep', () => {
  it('returns email first when email is missing', () => {
    expect(pickProfileCompletionStep(baseClient({ email: '' }))).toBe('email');
  });

  it('returns birthday when email ok but birthday missing', () => {
    expect(pickProfileCompletionStep(baseClient({ birthday: null }))).toBe('birthday');
  });

  it('returns avatar when birthday ok but avatar missing', () => {
    expect(pickProfileCompletionStep(baseClient({ avatarUrl: null }))).toBe('avatar');
  });

  it('returns address when avatar ok but address incomplete', () => {
    expect(pickProfileCompletionStep(baseClient({ address: '', city: 'Praha' }))).toBe('address');
    expect(pickProfileCompletionStep(baseClient({ address: 'Ulice', city: '' }))).toBe('address');
  });

  it('returns null when profile completion chain is complete', () => {
    expect(pickProfileCompletionStep(baseClient())).toBeNull();
  });
});
