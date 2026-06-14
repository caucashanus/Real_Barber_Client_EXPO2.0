import type { CrmClient } from '@/api/auth';
import type { ClientMe } from '@/api/client';
import type { AvatarChoice } from '@/components/signup/SignupAvatarPicker';
import { formatToYYYYMMDD } from '@/utils/date';

/** Sjednocené výchozí heslo pro nové účty z registrace (backend + případné přihlášení heslem). */
export const DEFAULT_SIGNUP_PASSWORD = '123456';

export const MOCK_AUTH_TOKEN = 'mock-signup-token';
export const MOCK_API_TOKEN = 'mock-signup-api-token';

export function paramString(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export function buildMockCrmClient(input: {
  firstName: string;
  lastName: string;
  email: string;
  fullPhone: string;
  avatarUrl: string;
  birthday: Date | null;
}): CrmClient {
  const now = new Date().toISOString();
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim() || 'Demo user';
  return {
    id: 'mock-signup-client',
    name,
    email: input.email.trim() || 'demo@local.app',
    phone: input.fullPhone,
    avatarUrl: input.avatarUrl.trim() || null,
    address: '',
    whatsapp: null,
    birthday: input.birthday ? formatToYYYYMMDD(input.birthday) : null,
    lastVisit: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function clientMeToCrm(me: ClientMe): CrmClient {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    phone: me.phone ?? '',
    avatarUrl: me.avatarUrl,
    address: me.address ?? '',
    whatsapp: me.whatsapp,
    birthday: me.birthday,
    lastVisit: me.lastVisit,
    createdAt: me.createdAt,
    updatedAt: me.updatedAt,
  };
}

export function emailRequiredValid(emailValue: string): boolean {
  const trimmed = emailValue.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function phoneDigitsValid(phoneDisplay: string): boolean {
  const digits = phoneDisplay.replace(/\D/g, '');
  return digits.length >= 9;
}

/** Pro mock / zobrazení (katalog = URL z API, vlastní = file://). */
export function avatarChoiceToStoredUrl(choice: AvatarChoice): string {
  if (choice.kind === 'none') return '';
  if (choice.kind === 'catalog') return choice.url;
  return choice.uri;
}

/** HTTPS URL katalogu pro pole avatarUrl při register. */
export function avatarUrlForRegister(choice: AvatarChoice): string | undefined {
  if (choice.kind !== 'catalog') return undefined;
  const u = choice.url.trim();
  if (u.startsWith('https://') || u.startsWith('http://')) return u;
  return undefined;
}

export function isSignupStepValid(
  idx: number,
  phoneLockedFromLogin: boolean,
  firstName: string,
  lastName: string,
  phone: string,
  email: string
): boolean {
  if (phoneLockedFromLogin) {
    switch (idx) {
      case 0:
        return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 1:
        return emailRequiredValid(email);
      case 2:
      case 3:
        return true;
      default:
        return true;
    }
  }
  switch (idx) {
    case 0:
      return firstName.trim().length > 0 && lastName.trim().length > 0;
    case 1:
      return phoneDigitsValid(phone);
    case 2:
      return emailRequiredValid(email);
    case 3:
    case 4:
      return true;
    default:
      return true;
  }
}
