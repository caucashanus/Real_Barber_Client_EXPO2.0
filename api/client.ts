import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';

import { CrmHttpError, fetchClientAppV1, fetchCrm } from './http';

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
  /** Status zákazníka z CRM (např. segment věrnosti); může být null. */
  customerStatus: string | null;
}

/** GET /api/client/me – current client information. */
export async function getClientMe(apiToken: string): Promise<ClientMe> {
  const path = CLIENT_APP_V1_ENABLED ? '/me' : '/api/client/me';
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;
  return fetcher<ClientMe>(path, { apiToken });
}

export interface UpdateClientMeBody {
  avatar?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  bio?: string;
  displayName?: string;
  language?: string;
  /** ISO 8601, např. `1990-05-15T00:00:00.000Z` */
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

  try {
    const data = await fetchCrm<unknown>('/api/client/media', {
      method: 'POST',
      apiToken,
      body: form,
    });

    const wrapped = data as
      | { mediaFile?: ClientMediaFile; file?: ClientMediaFile }
      | ClientMediaFile;
    const media =
      wrapped && typeof wrapped === 'object' && 'mediaFile' in wrapped
        ? wrapped.mediaFile
        : wrapped && typeof wrapped === 'object' && 'file' in wrapped
          ? wrapped.file
          : (wrapped as ClientMediaFile);
    if (!media?.id || !media?.url) {
      throw new Error('Media upload response is missing file url');
    }
    return media;
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 413) throw new Error('Soubor je příliš velký (max 15 MB)');
      if (e.status === 400) throw new Error(e.message || 'Neplatný soubor nebo parametry uploadu');
    }
    throw e;
  }
}

/** POST /api/client/avatar – nahrání profilové fotky (pouze po přihlášení klienta). */
export async function uploadClientAvatar(
  apiToken: string,
  input: UploadClientMediaInput
): Promise<void> {
  const filename = input.name?.trim() || `avatar-${Date.now()}.jpg`;
  const mimeType = input.mimeType?.trim() || inferMimeTypeFromName(filename);

  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  try {
    await fetchCrm<void>('/api/client/avatar', { method: 'POST', apiToken, body: form });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 413) throw new Error('Soubor je příliš velký');
    }
    throw e;
  }
}

/** DELETE /api/client/media/{id} – delete client's own media file. */
export async function deleteClientMedia(apiToken: string, mediaId: string): Promise<void> {
  try {
    await fetchCrm<void>(`/api/client/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
      apiToken,
    });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 403) throw new Error('Access denied');
      if (e.status === 404) throw new Error('Media file not found');
    }
    throw e;
  }
}

/** PATCH /api/client/me – update current client profile (partial). */
export async function patchClientMe(apiToken: string, body: UpdateClientMeBody): Promise<ClientMe> {
  const path = CLIENT_APP_V1_ENABLED ? '/me' : '/api/client/me';
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;
  try {
    return await fetcher<ClientMe>(path, { method: 'PATCH', apiToken, body });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 400) throw new Error('Invalid input data');
      if (e.status === 409) throw new Error('Phone number already exists');
      if (e.status === 500) throw new Error('Failed to update profile');
    }
    throw e;
  }
}

export interface DeleteClientAccountResponse {
  success: boolean;
  message: string;
  deletedAt: string;
}

/** DELETE /api/client/account – anonymize and disable current client account. */
export async function deleteClientAccount(
  apiToken: string,
  reason?: string
): Promise<DeleteClientAccountResponse> {
  try {
    return await fetchCrm<DeleteClientAccountResponse>('/api/client/account', {
      method: 'DELETE',
      apiToken,
      body: reason && reason.trim() ? { reason: reason.trim() } : undefined,
    });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 500) {
      throw new Error('Failed to delete account');
    }
    throw e;
  }
}
