import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  verified?: boolean;
}

/** POST /api/client/auth/otp/request — zjistí existenci klienta a případně odešle OTP. */
export interface OtpRequestExisting {
  exists: true;
  challengeSent: boolean;
  displayName?: string;
  expiresInSeconds?: number;
}

export interface OtpRequestNewClient {
  exists: false;
  requiresRegistration: true;
  challengeSent: boolean;
  expiresInSeconds?: number;
}

export type OtpRequestResponse = OtpRequestExisting | OtpRequestNewClient;

export async function requestClientOtp(phone: string): Promise<OtpRequestResponse> {
  const res = await fetch(`${CRM_BASE}/api/client/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone.trim() }),
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

  const data = (await res.json()) as Record<string, unknown>;
  if (data.exists === true) {
    return {
      exists: true,
      challengeSent: Boolean(data.challengeSent),
      displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
      expiresInSeconds:
        typeof data.expiresInSeconds === 'number' ? data.expiresInSeconds : undefined,
    };
  }
  return {
    exists: false,
    requiresRegistration: true,
    challengeSent: Boolean(data.challengeSent),
    expiresInSeconds: typeof data.expiresInSeconds === 'number' ? data.expiresInSeconds : undefined,
  };
}

export interface OtpVerifyRequiresRegistration {
  verified: true;
  requiresRegistration: true;
  registrationToken: string;
  expiresInSeconds?: number;
}

export type OtpVerifyResponse = LoginResponse | OtpVerifyRequiresRegistration;

/** POST /api/client/auth/otp/verify — ověření kódu; buď rovnou přihlásí, nebo vrátí registrationToken. */
export async function verifyClientOtp(phone: string, otpCode: string): Promise<OtpVerifyResponse> {
  const platform =
    Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : String(Platform.OS);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const res = await fetch(`${CRM_BASE}/api/client/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phone.trim(),
      otpCode: otpCode.trim(),
      platform,
      appVersion,
    }),
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

  const json = (await res.json()) as Record<string, unknown>;
  if (json.requiresRegistration === true) {
    return {
      verified: true,
      requiresRegistration: true,
      registrationToken: String(json.registrationToken ?? ''),
      expiresInSeconds:
        typeof json.expiresInSeconds === 'number' ? json.expiresInSeconds : undefined,
    };
  }
  return json as unknown as LoginResponse;
}

export async function loginWithPhone(phone: string, password: string): Promise<LoginResponse> {
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
  /** Veřejná URL (např. výběr z katalogu) – lze poslat už při registraci. */
  avatarUrl?: string;
  /** Datum narození (ISO 8601, např. …T00:00:00.000Z), pokud uživatel vyplnil krok před registrací. */
  birthday?: string;
}

/** POST /api/client/auth/register – nový klientský účet (telefon + heslo). Odpověď stejná jako u loginu. */
export async function registerWithPhone(
  phone: string,
  password: string,
  options?: RegisterOptions
): Promise<LoginResponse> {
  const platform =
    Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : String(Platform.OS);
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
  const fullName = [fn, ln].filter(Boolean).join(' ').trim();
  if (fullName) body.name = fullName;
  const avatarUrl = options?.avatarUrl?.trim();
  if (avatarUrl) body.avatarUrl = avatarUrl;
  const birthday = options?.birthday?.trim();
  if (birthday) body.birthday = birthday;

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

export interface RegisterWithOtpTokenBody extends RegisterOptions {
  phone: string;
  registrationToken: string;
  password: string;
  platform?: string;
  appVersion?: string;
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  whatsapp?: string;
}

/** POST /api/client/auth/register – registrace po OTP verify (vyžaduje registrationToken). */
export async function registerWithOtpToken(body: RegisterWithOtpTokenBody): Promise<LoginResponse> {
  const platform =
    Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : String(Platform.OS);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const fn = body.firstName?.trim();
  const ln = body.lastName?.trim();
  const fullName = [fn, ln].filter(Boolean).join(' ').trim();

  const res = await fetch(`${CRM_BASE}/api/client/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      phone: body.phone.trim(),
      registrationToken: body.registrationToken.trim(),
      password: body.password,
      name: body.name?.trim() || fullName || undefined,
      platform,
      appVersion,
    }),
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
