import { CRM_BASE } from './http';

import {
  HOME_AVAILABILITY_SERVICE_ID,
  TEAM_MEMBER_PAGE_DAYS,
  TEAM_MEMBER_PAGE_INCLUDE,
  TEAM_MEMBER_PAGE_MEDIA_LIMIT,
  TEAM_MEMBER_PAGE_REVIEWS_LIMIT,
  TEAM_MEMBER_PAGE_STORIES_LIMIT,
} from '@/constants/teamMemberPage';

export interface TeamMemberPageBranch {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  address?: string | null;
  imageUrl?: string | null;
}

export interface TeamMemberFavoriteService {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  webUrl?: string | null;
  imageUrl?: string | null;
  category?: { id: string; name: string };
}

export interface TeamMemberPageReview {
  id: string;
  rating: number;
  text?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt?: string | null;
  images?: string[];
}

export interface TeamMemberStory {
  id: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video' | string;
  caption?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
}

export interface TeamMemberMediaItem {
  id?: string;
  url: string;
  type?: 'image' | 'video' | string;
  order?: number;
  title?: string | null;
}

export interface TeamMemberShiftInterval {
  startTime: string;
  endTime: string;
  branchId: string;
}

export interface TeamMemberShiftDay {
  date: string;
  workIntervals?: TeamMemberShiftInterval[];
}

export interface TeamMemberPageEmployee {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  displayName?: string | null;
  displayNameEn?: string | null;
  displayNameUk?: string | null;
  avatarUrl?: string | null;
  avatarAlt?: string | null;
  bio?: string | null;
  bioEn?: string | null;
  bioUk?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionUk?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
  languages?: string[];
  phone?: string | null;
  contactPhone?: string | null;
  mobile?: string | null;
  hairstyleSkills?: Record<string, string>;
  coloringSkills?: Record<string, string>;
  branches?: TeamMemberPageBranch[];
  favoriteServices?: TeamMemberFavoriteService[];
  stats?: { totalReviews?: number; averageRating?: number };
  reviews?: TeamMemberPageReview[];
  stories?: TeamMemberStory[];
  media?: TeamMemberMediaItem[];
  shiftCalendar?: TeamMemberShiftDay[];
}

export interface TeamMemberPageResponse {
  employee?: TeamMemberPageEmployee;
  meta?: {
    generatedAt?: string;
    date?: string;
    serviceId?: string;
    days?: number;
  };
}

export interface EmployeeTodaySlot {
  date: string;
  time: string;
  endTime?: string;
  duration?: number;
  branchId: string;
}

export interface EmployeeTodaySlotsResponse {
  slots?: EmployeeTodaySlot[];
  meta?: {
    generatedAt?: string;
    date?: string;
    serviceId?: string;
    timezone?: string;
    employeeId?: string;
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

export interface GetTeamMemberPageOptions {
  date: string;
  serviceId?: string;
}

export async function getTeamMemberPage(
  idOrSlug: string,
  options: GetTeamMemberPageOptions
): Promise<TeamMemberPageResponse> {
  const params = new URLSearchParams({
    date: options.date,
    days: String(TEAM_MEMBER_PAGE_DAYS),
    include: TEAM_MEMBER_PAGE_INCLUDE,
    reviewsLimit: String(TEAM_MEMBER_PAGE_REVIEWS_LIMIT),
    storiesLimit: String(TEAM_MEMBER_PAGE_STORIES_LIMIT),
    mediaLimit: String(TEAM_MEMBER_PAGE_MEDIA_LIMIT),
  });
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  if (serviceId) params.set('serviceId', serviceId);

  const res = await fetch(
    `${CRM_BASE}/api/public/pages/team-member/${encodeURIComponent(idOrSlug)}?${params}`,
    { headers: { Accept: 'application/json' } }
  );
  return parsePublicJson<TeamMemberPageResponse>(res);
}

export interface GetEmployeeTodaySlotsOptions {
  date: string;
  serviceId?: string;
}

export async function getEmployeeTodaySlots(
  employeeId: string,
  options: GetEmployeeTodaySlotsOptions
): Promise<EmployeeTodaySlotsResponse> {
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  if (!serviceId) {
    throw new Error('Missing serviceId');
  }
  const params = new URLSearchParams({
    date: options.date,
    serviceId,
  });
  const res = await fetch(
    `${CRM_BASE}/api/public/employees/${encodeURIComponent(employeeId)}/today-slots?${params}`,
    {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
  return parsePublicJson<EmployeeTodaySlotsResponse>(res);
}
