import { notifyUnauthorized } from './session';

export const CRM_BASE = 'https://crm.xrb.cz';

/** Throws on 401 and triggers global session-expired redirect. */
export function checkAuthResponse(res: Response): void {
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error('Unauthorized');
  }
}

export async function parseCrmErrorMessage(
  res: Response,
  fallback = `Chyba ${res.status}`
): Promise<string> {
  const raw = await res.text();
  if (!raw) return fallback;
  try {
    const data = JSON.parse(raw) as { message?: string; error?: string };
    return data.message || data.error || raw.slice(0, 200) || fallback;
  } catch {
    return raw.slice(0, 200) || fallback;
  }
}

export interface FetchCrmOptions extends Omit<RequestInit, 'body'> {
  apiToken?: string;
  body?: unknown;
  /** When true (default if apiToken set), 401 triggers global sign-out. */
  checkAuth?: boolean;
}

export class CrmHttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'CrmHttpError';
  }
}

/** Central CRM HTTP client — JSON in/out, shared auth and error handling. */
export async function fetchCrm<T>(path: string, options: FetchCrmOptions = {}): Promise<T> {
  const { apiToken, body, checkAuth = Boolean(apiToken), headers, ...init } = options;
  const isFormBody = body instanceof FormData || body instanceof Blob;

  const res = await fetch(`${CRM_BASE}${path}`, {
    ...init,
    headers: {
      ...(body !== undefined && !isFormBody ? { 'Content-Type': 'application/json' } : {}),
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? (isFormBody ? body : JSON.stringify(body)) : undefined,
  });

  if (checkAuth) checkAuthResponse(res);

  if (!res.ok) {
    throw new CrmHttpError(await parseCrmErrorMessage(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
