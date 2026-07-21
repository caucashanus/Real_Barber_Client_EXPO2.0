import { CRM_BASE } from './http';

import { HOME_AVAILABILITY_SERVICE_ID } from '@/constants/teamMemberPage';

export interface HomepageTodayTeamBranch {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  address?: string | null;
}

export interface HomepageWorkInterval {
  startTime: string;
  endTime: string;
  branchId: string;
}

export interface HomepageTodayTeamMember {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  avatarUrl?: string | null;
  webUrl?: string | null;
  branches?: HomepageTodayTeamBranch[];
  workIntervals?: HomepageWorkInterval[];
}

export interface HomepagePageResponse {
  todayTeam?: HomepageTodayTeamMember[];
  meta?: {
    generatedAt?: string;
    date?: string;
    serviceId?: string;
    locale?: string;
  };
}

export interface HomepageNextSlot {
  date: string;
  time: string;
  endTime?: string;
  duration?: number;
  branchId: string;
}

export interface HomepageEmployeeAvailability {
  employeeId: string;
  nextSlots?: HomepageNextSlot[];
}

export interface HomepageTodayTeamAvailabilityResponse {
  availability?: HomepageEmployeeAvailability[];
  meta?: {
    generatedAt?: string;
    date?: string;
    serviceId?: string;
    timezone?: string;
  };
}

export interface GetHomepagePageOptions {
  date: string;
  serviceId?: string;
  locale?: string;
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

/** GET /api/public/pages/homepage — cacheable shell (todayTeam without live slots). */
export async function getHomepagePage(
  options: GetHomepagePageOptions
): Promise<HomepagePageResponse> {
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  const params = new URLSearchParams({
    date: options.date,
    includeAvailability: 'false',
  });
  if (serviceId) params.set('serviceId', serviceId);
  if (options.locale) params.set('locale', options.locale);

  const res = await fetch(`${CRM_BASE}/api/public/pages/homepage?${params}`, {
    headers: { Accept: 'application/json' },
  });
  return parsePublicJson<HomepagePageResponse>(res);
}

/** GET /api/public/homepage/today-team/availability — live next slots (no-store). */
export async function getHomepageTodayTeamAvailability(
  options: GetHomepagePageOptions
): Promise<HomepageTodayTeamAvailabilityResponse> {
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  const params = new URLSearchParams({ date: options.date });
  if (serviceId) params.set('serviceId', serviceId);
  if (options.locale) params.set('locale', options.locale);

  const res = await fetch(
    `${CRM_BASE}/api/public/homepage/today-team/availability?${params}`,
    {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
  return parsePublicJson<HomepageTodayTeamAvailabilityResponse>(res);
}
