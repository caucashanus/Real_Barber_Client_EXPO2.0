const CRM_BASE = 'https://crm.xrb.cz';

export interface CutBarber {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface CutPhotoMedia {
  id: string;
  filename?: string;
  url: string;
  fileType?: string;
  mimeType?: string;
  fileSize?: number;
  title?: string | null;
  alt?: string | null;
  createdAt?: string;
}

export interface CutPhoto {
  id: string;
  order: number;
  createdAt?: string;
  media: CutPhotoMedia;
}

export interface ClientCut {
  id: string;
  hairstyle: string;
  note?: string | null;
  creatorType?: string;
  createdAt: string;
  updatedAt: string;
  barber?: CutBarber | null;
  photos: CutPhoto[];
  photoCount: number;
}

export interface GetClientCutsOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'hairstyle';
  orderDirection?: 'asc' | 'desc';
  barber_id?: string;
}

export interface GetClientCutsResponse {
  client: { id: string; name: string; firstName?: string; lastName?: string; email?: string; phone?: string; avatarUrl?: string | null };
  cuts: ClientCut[];
  stats?: { totalCuts: number; cutsWithPhotos: number; cutsWithoutPhotos: number; totalPhotos: number };
  pagination?: { limit: number; offset: number; total: number; hasMore: boolean; currentPage: number; totalPages: number };
}

/** GET /api/client/cuts – list all haircuts for the current client. */
export async function getClientCuts(
  apiToken: string,
  options: GetClientCutsOptions = {}
): Promise<GetClientCutsResponse> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  if (options.orderBy) params.set('orderBy', options.orderBy);
  if (options.orderDirection) params.set('orderDirection', options.orderDirection);
  if (options.barber_id) params.set('barber_id', options.barber_id);
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/cuts${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<GetClientCutsResponse>;
}

export interface CreateClientCutBody {
  hairstyle: string;
  note?: string | null;
  barber_id?: string | null;
  photos?: string[];
}

/**
 * POST /api/client/cuts může vrátit buď přímo `ClientCut`, nebo stejný obal jako GET list (`{ client, cuts, stats, ... }`).
 */
function parseCreateClientCutResponse(raw: unknown, createdHairstyle: string): ClientCut | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  if (typeof o.id === 'string' && typeof o.hairstyle === 'string') {
    return raw as ClientCut;
  }

  const nestedCut = o.cut ?? o.createdCut;
  if (nestedCut && typeof nestedCut === 'object' && 'id' in nestedCut && 'hairstyle' in nestedCut) {
    return nestedCut as ClientCut;
  }

  const cuts = o.cuts;
  if (!Array.isArray(cuts) || cuts.length === 0) return null;

  const list = cuts as ClientCut[];
  const name = createdHairstyle.trim();
  const matches = list.filter((c) => c.hairstyle?.trim() === name);
  const pool = matches.length > 0 ? matches : list;
  const sorted = [...pool].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted[0] ?? null;
}

/** POST /api/client/cuts – create a new haircut. */
export async function createClientCut(
  apiToken: string,
  body: CreateClientCutBody
): Promise<ClientCut> {
  const hairstyleTrimmed = body.hairstyle.trim();

  const res = await fetch(`${CRM_BASE}/api/client/cuts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      hairstyle: hairstyleTrimmed,
      note: body.note?.trim() || null,
      barber_id: body.barber_id ?? null,
      photos: body.photos ?? [],
    }),
  });

  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Invalid input');
  }
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const raw = await res.json().catch(() => null);
  const cut = parseCreateClientCutResponse(raw, hairstyleTrimmed);
  if (!cut?.id) {
    throw new Error('Invalid response from server');
  }
  return cut;
}

/** GET /api/client/cuts/[id] – get a single haircut. */
export async function getClientCut(apiToken: string, id: string): Promise<ClientCut> {
  const res = await fetch(`${CRM_BASE}/api/client/cuts/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Haircut not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientCut>;
}

export interface PatchClientCutBody {
  hairstyle?: string;
  note?: string | null;
  barber_id?: string | null;
  /** Volitelné – pokud CRM podporuje doplnění fotek při PATCH. */
  photos?: string[];
}

/** Dokumentace CRM: PATCH vrací často jen `{ message, status }`; celý `ClientCut` doplníme GET. */
function responseLooksLikeClientCut(raw: unknown): raw is ClientCut {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.hairstyle === 'string';
}

function buildPatchClientCutPayload(body: PatchClientCutBody): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (body.hairstyle !== undefined) o.hairstyle = body.hairstyle.trim();
  if (body.note !== undefined) o.note = body.note === null ? '' : String(body.note).trim();
  if (body.barber_id !== undefined) o.barber_id = (body.barber_id ?? '').trim();
  if (body.photos !== undefined) o.photos = body.photos;
  return o;
}

/**
 * PATCH /api/client/cuts/[id] – úprava účesu (dokumentované: `hairstyle`, `note`, `barber_id`).
 * Volitelně lze poslat i `photos` (ID médií), pokud to backend umí.
 */
export async function patchClientCut(
  apiToken: string,
  id: string,
  body: PatchClientCutBody
): Promise<ClientCut> {
  const payload = buildPatchClientCutPayload(body);
  if (Object.keys(payload).length === 0) {
    return getClientCut(apiToken, id);
  }

  const res = await fetch(`${CRM_BASE}/api/client/cuts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Invalid input');
  }
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (res.status === 404) throw new Error('Haircut not found');
  if (res.status === 500) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Failed to update haircut');
  }
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const raw = await res.json().catch(() => null);
  if (responseLooksLikeClientCut(raw)) return raw;
  return getClientCut(apiToken, id);
}

/** DELETE /api/client/cuts/[id] – delete a haircut. */
export async function deleteClientCut(apiToken: string, id: string): Promise<{ message: string; deletedPhotos?: number }> {
  const res = await fetch(`${CRM_BASE}/api/client/cuts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (res.status === 404) throw new Error('Haircut not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<{ message: string; deletedPhotos?: number }>;
}
