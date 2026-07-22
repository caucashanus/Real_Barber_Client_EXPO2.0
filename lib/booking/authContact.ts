import type { CrmClient } from '@/api/auth';

export type AuthBookingContact = {
  firstName: string;
  lastName: string;
  email: string;
  countryIso: string;
  nationalDigits: string;
  phone: string;
};

function sanitizeNameOneWord(value: string): string {
  return value.trim().split(/\s+/)[0] ?? '';
}

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) {
    const only = sanitizeNameOneWord(parts[0]!);
    return { firstName: only, lastName: only };
  }
  return {
    firstName: sanitizeNameOneWord(parts[0]!),
    lastName: sanitizeNameOneWord(parts.slice(1).join(' ')),
  };
}

function splitPhoneToNational(phone: string): { countryIso: string; nationalDigits: string } | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('420') && digits.length >= 12) {
    return { countryIso: 'CZ', nationalDigits: digits.slice(3) };
  }
  if (digits.length >= 9 && digits.length <= 10) {
    return { countryIso: 'CZ', nationalDigits: digits.replace(/^0+/, '') };
  }
  return { countryIso: 'CZ', nationalDigits: digits };
}

export function mapAuthClientToBookingContact(
  client: CrmClient
): AuthBookingContact | null {
  const email = client.email?.trim() ?? '';
  const phoneRaw = client.phone?.trim() ?? '';
  if (!email || !phoneRaw) return null;

  const phoneParts = splitPhoneToNational(phoneRaw);
  if (!phoneParts) return null;

  const fromName = splitDisplayName(client.name ?? '');
  const firstName = fromName.firstName;
  let lastName = fromName.lastName;
  if (!firstName) return null;
  if (!lastName) lastName = firstName;

  return {
    firstName,
    lastName,
    email,
    countryIso: phoneParts.countryIso,
    nationalDigits: phoneParts.nationalDigits,
    phone: phoneRaw.startsWith('+') ? phoneRaw : `+420${phoneParts.nationalDigits}`,
  };
}

export function isAuthContactComplete(client: CrmClient | null | undefined): boolean {
  if (!client) return false;
  const mapped = mapAuthClientToBookingContact(client);
  if (!mapped) return false;
  return Boolean(mapped.firstName && mapped.lastName && mapped.email && mapped.nationalDigits);
}
