const CRM_BASE = 'https://crm.xrb.cz';

/** Vlajka „Avatarappdefault“ – veřejná média pro výběr avatara při registraci. */
export const AVATAR_APP_DEFAULT_FLAG_ID = 'f6435e7b-e566-4995-9887-346093d52bec';

export interface MediaFlag {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  category: string;
  permissions: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  s3Key: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  title: string | null;
  alt: string | null;
  isActive: boolean;
  isPublic: boolean;
  uploadedByUserId: string | null;
  uploadedByClientId: string | null;
  createdAt: string;
  updatedAt: string;
  flags: MediaFlag[];
}

export interface MediaListPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface MediaListResponse {
  mediaFiles: MediaFile[];
  pagination: MediaListPagination;
}

export interface GetPublicMediaOptions {
  flagId?: string;
  /** Výchozí: `AVATAR_APP_DEFAULT_FLAG_ID` */
  isPublic?: boolean;
  limit?: number;
  page?: number;
}

/**
 * GET /api/media – veřejná média podle vlajky (např. předvolby avatarů).
 */
export async function getPublicMediaPage(options: GetPublicMediaOptions = {}): Promise<MediaListResponse> {
  const {
    flagId = AVATAR_APP_DEFAULT_FLAG_ID,
    isPublic = true,
    limit = 50,
    page = 1,
  } = options;

  const q = new URLSearchParams();
  q.set('isPublic', String(isPublic));
  q.set('flagId', flagId);
  q.set('limit', String(limit));
  q.set('page', String(page));

  const res = await fetch(`${CRM_BASE}/api/media?${q.toString()}`);
  if (!res.ok) {
    throw new Error(`Media list failed: ${res.status}`);
  }
  return res.json() as Promise<MediaListResponse>;
}

/** Načte všechny stránky výsledků (pro katalog avatarů). */
export async function getAllPublicMediaByFlag(
  flagId: string = AVATAR_APP_DEFAULT_FLAG_ID
): Promise<MediaFile[]> {
  const collected: MediaFile[] = [];
  let page = 1;
  let pages = 1;

  do {
    const { mediaFiles, pagination } = await getPublicMediaPage({
      flagId,
      isPublic: true,
      page,
      limit: 50,
    });
    collected.push(...mediaFiles.filter((m) => m.isActive && m.url));
    pages = pagination.pages;
    page += 1;
  } while (page <= pages);

  return collected;
}
