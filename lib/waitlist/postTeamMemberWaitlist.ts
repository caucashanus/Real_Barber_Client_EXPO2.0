import { WEB_BFF_ORIGIN } from '@/constants/bookingMonitor';

import type {
  PostTeamMemberWaitlistParams,
  PostTeamMemberWaitlistResult,
  TeamMemberWaitlistPayload,
} from './types';

function omitEmpty(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

export function buildTeamMemberWaitlistPayload(
  params: PostTeamMemberWaitlistParams
): TeamMemberWaitlistPayload {
  return {
    phone: params.phone.trim().slice(0, 32),
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    branchLabel: params.branchLabel ?? null,
    dayIso: params.dayIso ?? null,
    source: 'app',
    isLoggedIn: true,
    clientName: params.clientName ?? null,
    clientEmail: params.clientEmail ?? null,
  };
}

/** POST web BFF → Telegram skupina Čekací listina (formátuje server). */
export async function postTeamMemberWaitlist(
  params: PostTeamMemberWaitlistParams
): Promise<PostTeamMemberWaitlistResult> {
  const url = `${WEB_BFF_ORIGIN}/api/team-member-waitlist/`;
  const body = buildTeamMemberWaitlistPayload(params);
  const json = JSON.stringify(omitEmpty(body as unknown as Record<string, unknown>));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: json,
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      skipped?: boolean;
      error?: string;
      telegramStatus?: number;
    } | null;

    // Best-effort UX: zápis v appce platí i když Telegram dočasně selže.
    if (res.status === 502) {
      return { ok: true, telegramStatus: data?.telegramStatus };
    }

    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.error ?? 'request_failed',
        telegramStatus: data?.telegramStatus,
      };
    }

    return { ok: true, skipped: data.skipped };
  } catch {
    return { ok: false, error: 'network' };
  }
}
