import { CRM_BASE } from './http';
import type { Branch, BranchEmployee } from './branches';
import type { TeamMemberPageReview } from './publicTeamMember';

import {
  BRANCH_PAGE_DAYS,
  BRANCH_PAGE_INCLUDE,
  BRANCH_PAGE_REVIEWS_LIMIT,
} from '@/constants/branchPage';
import { HOME_AVAILABILITY_SERVICE_ID } from '@/constants/teamMemberPage';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';

export interface BranchPageNearestSlot {
  date: string;
  time: string;
  endTime: string;
  duration: number;
  branchId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatarUrl?: string | null;
  employeeWebUrl?: string | null;
}

export interface BranchPageBranch {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionUk?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  media?: { url: string; order?: number; type?: string }[];
  isNew?: boolean;
  [key: string]: unknown;
}

export interface BranchPageResponse {
  branch?: BranchPageBranch;
  employees?: BranchEmployee[];
  nearestSlots?: BranchPageNearestSlot[];
  stats?: { totalReviews?: number; averageRating?: number };
  reviews?: TeamMemberPageReview[];
  meta?: {
    generatedAt?: string;
    date?: string;
    serviceId?: string;
    days?: number;
    count?: number;
  };
}

async function parsePublicJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Chyba ${res.status}`;
    try {
      const data = JSON.parse(text) as { error?: string; message?: string };
      message = data.error || data.message || message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new Error(message);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export interface GetPublicBranchPageOptions {
  date: string;
  serviceId?: string;
  days?: number;
  reviewsLimit?: number;
}

/** GET /api/public/pages/branch/{idOrSlug} */
export async function getPublicBranchPage(
  idOrSlug: string,
  options: GetPublicBranchPageOptions
): Promise<BranchPageResponse> {
  const params = new URLSearchParams({
    date: options.date,
    days: String(options.days ?? BRANCH_PAGE_DAYS),
    include: BRANCH_PAGE_INCLUDE,
    reviewsLimit: String(options.reviewsLimit ?? BRANCH_PAGE_REVIEWS_LIMIT),
  });
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  if (serviceId) params.set('serviceId', serviceId);

  const res = await fetch(
    `${CRM_BASE}/api/public/pages/branch/${encodeURIComponent(idOrSlug)}?${params}`,
    { headers: { Accept: 'application/json' } }
  );
  return parsePublicJson<BranchPageResponse>(res);
}

export function mapBranchPageToBranch(response: BranchPageResponse): Branch | null {
  if (!response.branch) return null;
  const employees = response.employees ?? [];
  return {
    ...response.branch,
    address: response.branch.address ?? undefined,
    latitude: response.branch.latitude ?? undefined,
    longitude: response.branch.longitude ?? undefined,
    employees,
    averageRating: response.stats?.averageRating,
    reviewCount: response.stats?.totalReviews,
  };
}

export function mapBranchPageSlotsToNearest(
  slots: BranchPageNearestSlot[] | undefined,
  branchName: string,
  branchAddress: string | null
): NearestBranchHomeSlot[] {
  return (slots ?? []).slice(0, 10).map((slot) => ({
    employeeId: slot.employeeId,
    employeeName: slot.employeeName,
    date: slot.date,
    time: slot.time,
    endTime: slot.endTime,
    duration: slot.duration,
    branchId: slot.branchId,
    branchName,
    branchAddress,
  }));
}
