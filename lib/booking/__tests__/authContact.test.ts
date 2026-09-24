import { describe, expect, it } from 'vitest';

import type { CrmClient } from '@/api/auth';
import {
  clientToBookingReservationContact,
  isAuthContactComplete,
  mapAuthClientToBookingContact,
} from '@/lib/booking/authContact';

const baseClient: CrmClient = {
  id: 'c1',
  name: 'Jan Novák',
  email: 'jan@example.com',
  phone: '+420777123456',
};

describe('authContact', () => {
  it('maps complete CRM client to reservation contact', () => {
    const contact = clientToBookingReservationContact(baseClient);
    expect(contact).toEqual({
      firstName: 'Jan',
      lastName: 'Novák',
      email: 'jan@example.com',
      phone: '+420777123456',
    });
    expect(isAuthContactComplete(baseClient)).toBe(true);
  });

  it('returns null when email or phone missing', () => {
    expect(
      clientToBookingReservationContact({ ...baseClient, email: '' })
    ).toBeNull();
    expect(
      clientToBookingReservationContact({ ...baseClient, phone: '' })
    ).toBeNull();
    expect(isAuthContactComplete({ ...baseClient, name: '' })).toBe(false);
  });

  it('requires a usable name for mapAuthClientToBookingContact', () => {
    expect(mapAuthClientToBookingContact({ ...baseClient, name: '   ' })).toBeNull();
  });
});
