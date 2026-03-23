const CRM_BASE = 'https://crm.xrb.cz';

export interface ClientMe {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  whatsapp: string | null;
  birthday: string | null;
  lastVisit: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/client/me – current client information. */
export async function getClientMe(apiToken: string): Promise<ClientMe> {
  const res = await fetch(`${CRM_BASE}/api/client/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientMe>;
}

export interface UpdateClientMeBody {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  bio?: string;
  displayName?: string;
  language?: string;
  birthday?: string;
  /** Street / address line (API uses flat shape: address, city, zip, country) */
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
}

export interface UploadClientMediaInput {
  uri: string;
  name?: string;
  mimeType?: string;
  title?: string;
  alt?: string;
  flagId?: string;
}

export interface ClientMediaFile {
  id: string;
  url: string;
  mimeType?: string;
  fileType?: string;
  fileSize?: number;
  title?: string | null;
  alt?: string | null;
}

function inferMimeTypeFromName(name: string): string {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  return 'application/octet-stream';
}

/** POST /api/client/media – upload client media and return created media file. */
export async function uploadClientMedia(
  apiToken: string,
  input: UploadClientMediaInput
): Promise<ClientMediaFile> {
  const filename = input.name?.trim() || `client-media-${Date.now()}.jpg`;
  const mimeType = input.mimeType?.trim() || inferMimeTypeFromName(filename);

  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);
  if (input.title?.trim()) form.append('title', input.title.trim());
  if (input.alt?.trim()) form.append('alt', input.alt.trim());
  if (input.flagId?.trim()) form.append('flagId', input.flagId.trim());

  const res = await fetch(`${CRM_BASE}/api/client/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: form,
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 413) throw new Error('Soubor je příliš velký (max 15 MB)');
  if (res.status === 400) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Neplatný soubor nebo parametry uploadu');
  }
  if (!res.ok) throw new Error(`Media upload failed: ${res.status}`);

  const data = (await res.json()) as
    | { mediaFile?: ClientMediaFile; file?: ClientMediaFile }
    | ClientMediaFile;
  const media = 'mediaFile' in data ? data.mediaFile : 'file' in data ? data.file : data;
  if (!media?.id || !media?.url) {
    throw new Error('Media upload response is missing file url');
  }
  return media;
}

/** PATCH /api/client/me – update current client profile (partial). */
export async function patchClientMe(apiToken: string, body: UpdateClientMeBody): Promise<ClientMe> {
  const res = await fetch(`${CRM_BASE}/api/client/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 400) throw new Error('Invalid input data');
  if (res.status === 409) throw new Error('Phone number already exists');
  if (res.status === 500) throw new Error('Failed to update profile');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientMe>;
}
