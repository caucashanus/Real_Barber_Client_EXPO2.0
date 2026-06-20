import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';

import { CrmHttpError, fetchClientAppV1, fetchCrm } from './http';

function authPlatform(): string {
  return Platform.OS === 'ios'
    ? 'iOS'
    : Platform.OS === 'android'
      ? 'Android'
      : String(Platform.OS);
}

function authAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

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
  const path = CLIENT_APP_V1_ENABLED ? '/auth/otp/request' : '/api/client/auth/otp/request';
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;
  const data = await fetcher<Record<string, unknown>>(path, {
    method: 'POST',
    checkAuth: false,
    body: { phone: phone.trim() },
  });

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
  const path = CLIENT_APP_V1_ENABLED ? '/auth/otp/verify' : '/api/client/auth/otp/verify';
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;
  const json = await fetcher<Record<string, unknown>>(path, {
    method: 'POST',
    checkAuth: false,
    body: {
      phone: phone.trim(),
      otpCode: otpCode.trim(),
      platform: authPlatform(),
      appVersion: authAppVersion(),
    },
  });

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
  try {
    return await fetchCrm<LoginResponse>('/api/client/auth/login', {
      method: 'POST',
      checkAuth: false,
      body: {
        phone: phone.trim(),
        password,
        platform: Platform.OS as string,
        appVersion: authAppVersion(),
      },
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 401) {
      throw new Error('Nesprávné údaje');
    }
    throw e;
  }
}

export interface RegisterOptions {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  birthday?: string;
}

/** POST /api/client/auth/register – nový klientský účet (telefon + heslo). */
export async function registerWithPhone(
  phone: string,
  password: string,
  options?: RegisterOptions
): Promise<LoginResponse> {
  const body: Record<string, unknown> = {
    phone: phone.trim(),
    platform: authPlatform(),
    appVersion: authAppVersion(),
  };
  if (!CLIENT_APP_V1_ENABLED) {
    body.password = password;
  }
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

  const path = CLIENT_APP_V1_ENABLED ? '/auth/register' : '/api/client/auth/register';
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;
  return fetcher<LoginResponse>(path, {
    method: 'POST',
    checkAuth: false,
    body,
  });
}

export interface RegisterWithOtpTokenBody extends RegisterOptions {
  phone: string;
  registrationToken: string;
  password?: string;
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
  const fn = body.firstName?.trim();
  const ln = body.lastName?.trim();
  const fullName = [fn, ln].filter(Boolean).join(' ').trim();

  const payload: Record<string, unknown> = {
    ...body,
    phone: body.phone.trim(),
    registrationToken: body.registrationToken.trim(),
    name: body.name?.trim() || fullName || undefined,
    platform: authPlatform(),
    appVersion: authAppVersion(),
  };
  if (!CLIENT_APP_V1_ENABLED) {
    payload.password = body.password;
  }

  const path = CLIENT_APP_V1_ENABLED ? '/auth/register' : '/api/client/auth/register';
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;
  return fetcher<LoginResponse>(path, {
    method: 'POST',
    checkAuth: false,
    body: payload,
  });
}

/** POST /api/client/auth/forgot-password */
export async function forgotPassword(identifier: string): Promise<void> {
  try {
    await fetchCrm<void>('/api/client/auth/forgot-password', {
      method: 'POST',
      checkAuth: false,
      body: { identifier: identifier.trim() },
    });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 400) throw new Error('Zadejte email nebo telefonní číslo');
      if (e.status === 429) throw new Error('Příliš mnoho požadavků. Zkuste to později.');
    }
    throw e;
  }
}

/** POST /api/client/change-password */
export async function changePassword(
  apiToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await fetchCrm<void>('/api/client/change-password', {
    method: 'POST',
    apiToken,
    body: { currentPassword, newPassword },
  });
}
