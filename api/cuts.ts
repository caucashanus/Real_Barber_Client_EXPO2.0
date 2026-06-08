import { CrmHttpError, fetchCrm } from './http';

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
  client: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  cuts: ClientCut[];
  stats?: {
    totalCuts: number;
    cutsWithPhotos: number;
    cutsWithoutPhotos: number;
    totalPhotos: number;
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
  };
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

  return fetchCrm<GetClientCutsResponse>(`/api/client/cuts${qs ? `?${qs}` : ''}`, { apiToken });
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

/** POST někdy vrátí jen `{ message, status }` nebo `{ id }` bez plného ClientCut – pro doplnění GET. */
function extractCutIdFromCreateResponse(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === 'string' && o.id.length > 0) return o.id;
  const nested = o.cut ?? o.createdCut ?? o.data;
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>;
    if (typeof n.id === 'string' && n.id.length > 0) return n.id;
  }
  return null;
}

/** POST /api/client/cuts – create a new haircut. */
export async function createClientCut(
  apiToken: string,
  body: CreateClientCutBody
): Promise<ClientCut> {
  const hairstyleTrimmed = body.hairstyle.trim();

  let raw: unknown;
  try {
    raw = await fetchCrm<unknown>('/api/client/cuts', {
      method: 'POST',
      apiToken,
      body: {
        hairstyle: hairstyleTrimmed,
        note: body.note?.trim() || null,
        barber_id: body.barber_id ?? null,
        photos: body.photos ?? [],
      },
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 400) {
      throw new Error(e.message || 'Invalid input');
    }
    throw e;
  }

  let cut = parseCreateClientCutResponse(raw, hairstyleTrimmed);

  if (!cut?.id) {
    const idOnly = extractCutIdFromCreateResponse(raw);
    if (idOnly) {
      try {
        cut = await getClientCut(apiToken, idOnly);
      } catch {
        cut = null;
      }
    }
  }

  if (!cut?.id) {
    try {
      const listRes = await getClientCuts(apiToken, {
        limit: 25,
        orderBy: 'updatedAt',
        orderDirection: 'desc',
      });
      const cuts = listRes.cuts ?? [];
      const name = hairstyleTrimmed;
      const matches = cuts.filter((c) => c.hairstyle?.trim() === name);
      const pool = matches.length > 0 ? matches : cuts;
      cut =
        [...pool].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0] ?? null;
    } catch {
      cut = null;
    }
  }

  if (!cut?.id) {
    throw new Error('Invalid response from server');
  }
  return cut;
}

/** GET /api/client/cuts/[id] – get a single haircut. */
export async function getClientCut(apiToken: string, id: string): Promise<ClientCut> {
  try {
    return await fetchCrm<ClientCut>(`/api/client/cuts/${id}`, { apiToken });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Haircut not found');
    throw e;
  }
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

  try {
    const raw = await fetchCrm<unknown>(`/api/client/cuts/${id}`, {
      method: 'PATCH',
      apiToken,
      body: payload,
    });
    if (responseLooksLikeClientCut(raw)) return raw;
    return getClientCut(apiToken, id);
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 400) throw new Error(e.message || 'Invalid input');
      if (e.status === 403) throw new Error('Forbidden');
      if (e.status === 404) throw new Error('Haircut not found');
      if (e.status === 500) throw new Error(e.message || 'Failed to update haircut');
    }
    throw e;
  }
}

/** DELETE /api/client/cuts/[id] – delete a haircut. */
export async function deleteClientCut(
  apiToken: string,
  id: string
): Promise<{ message: string; deletedPhotos?: number }> {
  try {
    return await fetchCrm<{ message: string; deletedPhotos?: number }>(`/api/client/cuts/${id}`, {
      method: 'DELETE',
      apiToken,
    });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 403) throw new Error('Forbidden');
      if (e.status === 404) throw new Error('Haircut not found');
    }
    throw e;
  }
}
