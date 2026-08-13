import { fetchCrm } from './http';

import type { TeamMemberPageReview } from './publicTeamMember';

import {
  HAIRSTYLE_PAGE_INCLUDE,
  HAIRSTYLE_PAGE_MEDIA_LIMIT,
  HAIRSTYLE_PAGE_REVIEWS_LIMIT,
  HAIRSTYLE_PAGE_SIMILAR_LIMIT,
} from '@/constants/hairstylePage';

export interface PublicHairstyleSimilar {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
}

export interface PublicHairstyleMedia {
  id: string;
  url: string;
  type?: string;
  order?: number;
  title?: string | null;
  titleEn?: string | null;
}

export interface PublicHairstyleNamedEntity {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
}

export interface PublicHairstyleNearestSlot {
  date: string;
  time: string;
  endTime: string;
  duration: number;
  branch: PublicHairstyleNamedEntity;
  employee: PublicHairstyleNamedEntity;
}

export interface PublicHairstylePreferredEmployee {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  avatarUrl: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
}

export interface PublicHairstyle {
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
  imageAlt?: string | null;
  imageAltEn?: string | null;
  media?: PublicHairstyleMedia[];
  faceShapes: string[];
  hairTypes: string[];
  hairProperties: string[];
  hairLengths: string[];
  stylingDifficulty: number | null;
  popularity: number | null;
  tag: string | null;
  tagEn?: string | null;
  intendedFor: string | null;
  intendedForEn?: string | null;
  intendedForUk?: string | null;
  similarHairstyles: PublicHairstyleSimilar[];
  nearestSlots?: PublicHairstyleNearestSlot[];
  preferredEmployees?: PublicHairstylePreferredEmployee[];
  stats?: { totalReviews?: number; averageRating?: number };
  reviews?: TeamMemberPageReview[];
}

export interface PublicHairstylePageResponse {
  hairstyle?: PublicHairstyle;
  enums?: Record<string, string[]>;
  meta?: {
    generatedAt?: string;
    resolvedSlug?: string;
  };
}

function normalizeNamedEntity(raw: unknown): PublicHairstyleNamedEntity | null {
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
  };
}

function normalizeNearestSlot(raw: unknown): PublicHairstyleNearestSlot | null {
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

function normalizePreferredEmployee(raw: unknown): PublicHairstylePreferredEmployee | null {
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
    webUrlEn: typeof o.webUrlEn === 'string' ? o.webUrlEn : null,
  };
}

export function normalizePublicHairstyle(raw: PublicHairstyle & Record<string, unknown>): PublicHairstyle {
  return {
    ...raw,
    faceShapes: Array.isArray(raw.faceShapes) ? raw.faceShapes : [],
    hairTypes: Array.isArray(raw.hairTypes) ? raw.hairTypes : [],
    hairProperties: Array.isArray(raw.hairProperties) ? raw.hairProperties : [],
    hairLengths: Array.isArray(raw.hairLengths) ? raw.hairLengths : [],
    similarHairstyles: Array.isArray(raw.similarHairstyles) ? raw.similarHairstyles : [],
    nearestSlots: Array.isArray(raw.nearestSlots)
      ? raw.nearestSlots
          .map(normalizeNearestSlot)
          .filter((slot): slot is PublicHairstyleNearestSlot => slot != null)
      : [],
    preferredEmployees: Array.isArray(raw.preferredEmployees)
      ? raw.preferredEmployees
          .map(normalizePreferredEmployee)
          .filter((emp): emp is PublicHairstylePreferredEmployee => emp != null)
      : [],
    stats:
      raw.stats && typeof raw.stats === 'object'
        ? {
            totalReviews:
              typeof (raw.stats as { totalReviews?: unknown }).totalReviews === 'number'
                ? (raw.stats as { totalReviews: number }).totalReviews
                : 0,
            averageRating:
              typeof (raw.stats as { averageRating?: unknown }).averageRating === 'number'
                ? (raw.stats as { averageRating: number }).averageRating
                : 0,
          }
        : { totalReviews: 0, averageRating: 0 },
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    stylingDifficulty:
      typeof raw.stylingDifficulty === 'number' ? raw.stylingDifficulty : null,
    popularity: typeof raw.popularity === 'number' ? raw.popularity : null,
    tag: typeof raw.tag === 'string' && raw.tag.trim() ? raw.tag.trim() : null,
    intendedFor:
      typeof raw.intendedFor === 'string' && raw.intendedFor.trim()
        ? raw.intendedFor.trim()
        : null,
  };
}

/** GET /api/public/pages/hairstyle/{idOrSlug} */
export async function fetchPublicHairstylePage(
  idOrSlug: string,
  options?: { bustCache?: boolean }
): Promise<PublicHairstyle | null> {
  const params = new URLSearchParams({
    include: HAIRSTYLE_PAGE_INCLUDE,
    similarLimit: String(HAIRSTYLE_PAGE_SIMILAR_LIMIT),
    mediaLimit: String(HAIRSTYLE_PAGE_MEDIA_LIMIT),
    reviewsLimit: String(HAIRSTYLE_PAGE_REVIEWS_LIMIT),
  });
  if (options?.bustCache) params.set('_', String(Date.now()));

  const data = await fetchCrm<PublicHairstylePageResponse>(
    `/api/public/pages/hairstyle/${encodeURIComponent(idOrSlug)}?${params}`,
    { checkAuth: false }
  );

  if (!data?.hairstyle) return null;
  return normalizePublicHairstyle(data.hairstyle as PublicHairstyle & Record<string, unknown>);
}
