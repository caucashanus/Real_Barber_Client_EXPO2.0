import { WEB_BFF_ORIGIN } from '@/constants/bookingMonitor';

import type { KidsWatchSubmitBody } from '@/api/kids-watch';

export type PostKidsWatchResult = {
  ok: boolean;
  id?: string;
  error?: string;
  telegramStatus?: number;
  httpStatus?: number;
};

function buildPayload(body: KidsWatchSubmitBody): KidsWatchSubmitBody & { source: 'app' } {
  return {
    ...body,
    source: 'app',
  };
}

function parseKidsWatchJson(
  data: {
    ok?: boolean;
    id?: string;
    error?: string;
    message?: string;
    telegramStatus?: number;
  } | null,
  res: Response
): PostKidsWatchResult {
  if (res.status === 502) {
    return { ok: true, id: data?.id, telegramStatus: data?.telegramStatus, httpStatus: 502 };
  }

  if (res.ok && data?.ok !== false) {
    return { ok: true, id: data?.id, httpStatus: res.status };
  }

  return {
    ok: false,
    error: data?.error ?? data?.message ?? 'request_failed',
    telegramStatus: data?.telegramStatus,
    httpStatus: res.status,
  };
}

/** POST web BFF → Telegram (formátuje server). Parita web `POST /api/kids-watch/`. */
export async function postKidsWatch(
  apiToken: string,
  body: KidsWatchSubmitBody
): Promise<PostKidsWatchResult> {
  const url = `${WEB_BFF_ORIGIN}/api/kids-watch/`;
  const payload = buildPayload(body);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? ((await res.json().catch(() => null)) as Parameters<typeof parseKidsWatchJson>[0])
      : null;

    if (res.status === 404 || (res.status >= 400 && data == null && !contentType.includes('json'))) {
      return { ok: false, error: 'endpoint_not_found', httpStatus: res.status };
    }

    return parseKidsWatchJson(data, res);
  } catch {
    return { ok: false, error: 'network' };
  }
}
