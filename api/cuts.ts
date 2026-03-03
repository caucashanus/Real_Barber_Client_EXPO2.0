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

/** POST /api/client/cuts – create a new haircut. */
export async function createClientCut(
  apiToken: string,
  body: CreateClientCutBody
): Promise<ClientCut> {
  const res = await fetch(`${CRM_BASE}/api/client/cuts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      hairstyle: body.hairstyle.trim(),
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

  return res.json() as Promise<ClientCut>;
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
}

/** PATCH /api/client/cuts/[id] – update a haircut (name, note, barber). */
export async function patchClientCut(
  apiToken: string,
  id: string,
  body: PatchClientCutBody
): Promise<ClientCut> {
  const res = await fetch(`${CRM_BASE}/api/client/cuts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Invalid input');
  }
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (res.status === 404) throw new Error('Haircut not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientCut>;
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
