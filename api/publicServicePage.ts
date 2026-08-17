import { fetchCrm } from './http';

import {
  SERVICE_PAGE_DAYS,
  SERVICE_PAGE_INCLUDE,
} from '@/constants/servicePage';

export interface PublicServiceNamedEntity {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  avatarUrl?: string | null;
  webUrl?: string | null;
}

export interface PublicServiceNearestSlot {
  date: string;
  time: string;
  endTime: string;
  duration: number;
  branch: PublicServiceNamedEntity;
  employee: PublicServiceNamedEntity;
}

export interface PublicServiceMedia {
  id?: string;
  url: string;
  type?: string;
  order?: number;
}

export interface PublicCatalogService {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionUk?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  imageUrl?: string | null;
  media?: PublicServiceMedia[];
  nearestSlots?: PublicServiceNearestSlot[];
  isNew?: boolean;
}

export interface PublicServicePageResponse {
  service?: PublicCatalogService;
  meta?: {
    generatedAt?: string;
    resolvedSlug?: string;
    date?: string;
    days?: number;
  };
}

function normalizeNamedEntity(raw: unknown): PublicServiceNamedEntity | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id.trim() : '';
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!id || !name) return null;
  return {
    id,
    name,
    nameEn: typeof o.nameEn === 'string' ? o.nameEn : null,
    nameUk: typeof o.nameUk === 'string' ? o.nameUk : null,
    avatarUrl:
      typeof o.avatarUrl === 'string' && o.avatarUrl.trim() ? o.avatarUrl.trim() : null,
    webUrl: typeof o.webUrl === 'string' ? o.webUrl : null,
  };
}

function normalizeNearestSlot(raw: unknown): PublicServiceNearestSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const date = typeof o.date === 'string' ? o.date.trim() : '';
  const time = typeof o.time === 'string' ? o.time.trim() : '';
  const endTime = typeof o.endTime === 'string' ? o.endTime.trim() : '';
  const duration = typeof o.duration === 'number' ? o.duration : NaN;
  const branch = normalizeNamedEntity(o.branch);
  const employee = normalizeNamedEntity(o.employee);
  if (!date || !time || !endTime || !Number.isFinite(duration) || !branch || !employee) {
    return null;
  }
  return { date, time, endTime, duration, branch, employee };
}

export function normalizePublicCatalogService(
  raw: PublicCatalogService & Record<string, unknown>
): PublicCatalogService {
  return {
    ...raw,
    nearestSlots: Array.isArray(raw.nearestSlots)
      ? raw.nearestSlots
          .map(normalizeNearestSlot)
          .filter((slot): slot is PublicServiceNearestSlot => slot != null)
      : [],
    media: Array.isArray(raw.media) ? raw.media : [],
  };
}

export interface FetchPublicServicePageOptions {
  date: string;
  days?: number;
  bustCache?: boolean;
}

/** GET /api/public/pages/service/{idOrSlug} */
export async function fetchPublicServicePage(
  idOrSlug: string,
  options: FetchPublicServicePageOptions
): Promise<PublicCatalogService | null> {
  const params = new URLSearchParams({
    include: SERVICE_PAGE_INCLUDE,
    date: options.date,
    days: String(options.days ?? SERVICE_PAGE_DAYS),
  });
  if (options.bustCache) params.set('_', String(Date.now()));

  const data = await fetchCrm<PublicServicePageResponse>(
    `/api/public/pages/service/${encodeURIComponent(idOrSlug)}?${params}`,
    { checkAuth: false }
  );

  if (!data?.service) return null;
  return normalizePublicCatalogService(
    data.service as PublicCatalogService & Record<string, unknown>
  );
}
