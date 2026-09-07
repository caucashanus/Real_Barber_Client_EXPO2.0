import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { WEB_BFF_ORIGIN } from '@/constants/bookingMonitor';

/** Login OTP events for web `/api/booking-monitor` (Telegram OTP-Monitoring). */
export type LoginOtpMonitorEvent = 'invalid_otp' | 'otp_success' | 'cancel_phone';

export type LoginOtpMonitorFields = {
  phone?: string | null;
  clientName?: string | null;
  email?: string | null;
  otpIncompleteDetail?: string | null;
};

type LoginOtpMonitorPayload = {
  event: LoginOtpMonitorEvent;
  source: 'app';
  otpFlow: 'login';
  sessionId: string;
  entry: 'unknown';
  phone?: string;
  clientName?: string;
  email?: string;
  userAgent?: string;
  otpIncompleteDetail?: string;
};

let sessionId: string | null = null;
let terminalEventSent = false;

function randomSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `login_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function loginOtpUserAgent(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
  return `RealBarberApp/${version} (${os} ${Platform.Version})`;
}

function omitNullish(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

async function postLoginOtpMonitorPayload(payload: LoginOtpMonitorPayload): Promise<void> {
  // Trailing slash — Next web má trailingSlash: true; bez něj Vercel 308 a RN POST neprojde.
  const url = `${WEB_BFF_ORIGIN}/api/booking-monitor/`;
  const json = JSON.stringify(omitNullish(payload as unknown as Record<string, unknown>));

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: json,
      cache: 'no-store',
    });
  } catch {
    // Fire-and-forget — monitoring nesmí blokovat login UI.
  }
}

/** Start a new login OTP monitoring session (call when SMS OTP is requested). */
export function beginLoginOtpMonitorSession(): string {
  sessionId = randomSessionId();
  terminalEventSent = false;
  return sessionId;
}

/** Resume session after navigating to the OTP screen (route param). */
export function resumeLoginOtpMonitorSession(id: string | null | undefined): string {
  const trimmed = id?.trim();
  if (trimmed && trimmed.length >= 8) {
    sessionId = trimmed;
    return sessionId;
  }
  return beginLoginOtpMonitorSession();
}

export function getLoginOtpMonitorSessionId(): string | null {
  return sessionId;
}

/**
 * Fire-and-forget login OTP event → web booking-monitor (otpFlow=login).
 * Never send the OTP code.
 */
export function trackLoginOtpMonitor(
  event: LoginOtpMonitorEvent,
  fields?: LoginOtpMonitorFields
): void {
  if (!sessionId || sessionId.length < 8) {
    beginLoginOtpMonitorSession();
  }
  if (!sessionId) return;

  if (terminalEventSent && (event === 'otp_success' || event === 'cancel_phone')) {
    return;
  }

  const phone = fields?.phone?.trim() || undefined;
  const clientName = fields?.clientName?.trim() || undefined;
  const email = fields?.email?.trim() || undefined;
  const otpIncompleteDetail = fields?.otpIncompleteDetail?.trim() || undefined;

  const payload: LoginOtpMonitorPayload = {
    event,
    source: 'app',
    otpFlow: 'login',
    sessionId,
    entry: 'unknown',
    phone,
    clientName,
    email,
    userAgent: loginOtpUserAgent(),
    otpIncompleteDetail,
  };

  if (event === 'otp_success' || event === 'cancel_phone') {
    terminalEventSent = true;
  }

  void postLoginOtpMonitorPayload(payload);
}

export function clearLoginOtpMonitorSession(): void {
  sessionId = null;
  terminalEventSent = false;
}
