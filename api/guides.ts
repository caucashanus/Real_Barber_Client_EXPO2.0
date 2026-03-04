const CRM_BASE = 'https://crm.xrb.cz';

export interface GuideMediaFile {
  id: string;
  filename: string;
  url: string;
  fileType: string;
  mimeType: string;
  fileSize?: number;
  title: string | null;
  alt: string | null;
}

export interface GuideMedia {
  id: string;
  guideId: string;
  mediaFileId: string;
  order: number;
  caption: string | null;
  section: string | null;
  duration: number | null;
  thumbnailUrl: string | null;
  mediaFile: GuideMediaFile;
}

export interface ClientGuide {
  id: string;
  title: string;
  content: string;
  targetStaff: boolean;
  targetCustomer: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  media: GuideMedia[];
}

let guidesCache: ClientGuide[] = [];

/** Store guides from list response so detail can use them without a second request. */
export function setGuidesCache(guides: ClientGuide[]): void {
  guidesCache = guides;
}

/** Get a guide by id from the last list response. Returns null if not in cache. */
export function getCachedGuide(id: string): ClientGuide | null {
  return guidesCache.find((g) => g.id === id) ?? null;
}

/** Get the full cached list (order preserved) for prev/next navigation. */
export function getCachedGuidesList(): ClientGuide[] {
  return guidesCache;
}

/** GET /api/client/guides – list active customer guides (no auth). */
export async function getClientGuides(): Promise<ClientGuide[]> {
  const res = await fetch(`${CRM_BASE}/api/client/guides`);
  if (!res.ok) throw new Error(`Failed to fetch guides: ${res.status}`);
  const guides = (await res.json()) as ClientGuide[];
  setGuidesCache(guides);
  return guides;
}
