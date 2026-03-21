import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CRM_BASE = 'https://crm.xrb.cz';

export interface CrmClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  address: string;
  whatsapp: string | null;
  birthday: string | null;
  lastVisit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  client: CrmClient;
  token: string;
  apiToken: string;
}

export async function loginWithPhone(
  phone: string,
  password: string
): Promise<LoginResponse> {
  const platform = Platform.OS as string;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const res = await fetch(`${CRM_BASE}/api/client/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phone.trim(),
      password,
      platform,
      appVersion,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(res.status === 401 ? 'Nesprávné údaje' : errBody || `Chyba ${res.status}`);
  }

  return res.json() as Promise<LoginResponse>;
}

export interface RegisterOptions {
  /** Volitelný e-mail (backend ho může vyžadovat nebo ne podle verze API). */
  email?: string;
  firstName?: string;
  lastName?: string;
}

/** POST /api/client/auth/register – nový klientský účet (telefon + heslo). Odpověď stejná jako u loginu. */
export async function registerWithPhone(
  phone: string,
  password: string,
  options?: RegisterOptions
): Promise<LoginResponse> {
  const platform = Platform.OS as string;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const body: Record<string, unknown> = {
    phone: phone.trim(),
    password,
    platform,
    appVersion,
  };
  const email = options?.email?.trim();
  if (email) body.email = email;
  const fn = options?.firstName?.trim();
  const ln = options?.lastName?.trim();
  if (fn) body.firstName = fn;
  if (ln) body.lastName = ln;

  const res = await fetch(`${CRM_BASE}/api/client/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.text();
    let message = `Chyba ${res.status}`;
    try {
      const data = JSON.parse(raw) as { message?: string; error?: string };
      message = data.message || data.error || raw.slice(0, 200) || message;
    } catch {
      if (raw) message = raw.slice(0, 200);
    }
    throw new Error(message);
  }

  return res.json() as Promise<LoginResponse>;
}

/** POST /api/client/auth/forgot-password – request password reset (identifier = email or phone). */
export async function forgotPassword(identifier: string): Promise<void> {
  const res = await fetch(`${CRM_BASE}/api/client/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: identifier.trim() }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    if (res.status === 400) throw new Error('Zadejte email nebo telefonní číslo');
    if (res.status === 429) throw new Error('Příliš mnoho požadavků. Zkuste to později.');
    throw new Error(errBody || `Chyba ${res.status}`);
  }
}

/** POST /api/client/change-password – change authenticated client password. */
export async function changePassword(
  apiToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${CRM_BASE}/api/client/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(errBody || `Chyba ${res.status}`);
  }
}
