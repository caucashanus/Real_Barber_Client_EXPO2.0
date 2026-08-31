import { CRM_BASE } from '@/api/http';

import {
  mapBranchCards,
  mapPromoCards,
  mapSlotCards,
  mapTeamCards,
  STATIC_BRANCHES,
  type AvailabilityEmployee,
  type PublicBranch,
} from '@/lib/rbicek/crm/mapCards';
import { RBICEK_WEB_BASE_URL } from '@/constants/rbicek';
import type {
  BranchCardData,
  PromoCardData,
  RbicekLocale,
  SlotCardData,
  TeamMemberCardData,
} from '@/lib/rbicek/types';
import { pragueTodayIso } from '@/lib/rbicek/utils';

async function crmGet<T>(path: string, userToken?: string | null): Promise<T> {
  const res = await fetch(`${CRM_BASE}/api${path}`, {
    headers: {
      Accept: 'application/json',
      ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`CRM ${res.status}`);
  }
  return (await res.json()) as T;
}

function availabilityQuery(limit: string): string {
  const today = pragueTodayIso();
  const params = new URLSearchParams({
    serviceId: '',
    branchId: '',
    employeeId: '',
    mode: 'employees',
    date: today,
    maxDays: '7',
    limit,
    includeFullyBooked: 'true',
  });
  return `/public/availability/next?${params}`;
}

export async function fetchNearestSlots(
  locale: RbicekLocale,
  userToken?: string | null,
  webBaseUrl = RBICEK_WEB_BASE_URL
): Promise<SlotCardData[]> {
  const data = await crmGet<{ results?: AvailabilityEmployee[] }>(
    availabilityQuery('4'),
    userToken
  );
  return mapSlotCards(data.results ?? [], locale, webBaseUrl, 4);
}

export async function fetchTodayTeam(
  locale: RbicekLocale,
  userToken?: string | null,
  webBaseUrl = RBICEK_WEB_BASE_URL
): Promise<TeamMemberCardData[]> {
  const data = await crmGet<{ results?: AvailabilityEmployee[] }>(
    availabilityQuery('50'),
    userToken
  );
  return mapTeamCards(data.results ?? [], locale, webBaseUrl);
}

export async function fetchBranches(
  locale: RbicekLocale,
  userToken?: string | null,
  webBaseUrl = RBICEK_WEB_BASE_URL
): Promise<BranchCardData[]> {
  try {
    const data = await crmGet<{ branches?: PublicBranch[] }>('/public/branches', userToken);
    const mapped = mapBranchCards(data.branches ?? [], locale, webBaseUrl);
    return mapped.length ? mapped : STATIC_BRANCHES;
  } catch {
    return STATIC_BRANCHES;
  }
}

export async function fetchPromoCards(
  locale: RbicekLocale,
  userId?: string | null,
  userToken?: string | null,
  webBaseUrl = RBICEK_WEB_BASE_URL
): Promise<PromoCardData[]> {
  const seed = userId ?? userToken ?? 'guest';
  try {
    const [posters, coupons] = await Promise.all([
      crmGet<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>(
        `/offers/posters?seed=${encodeURIComponent(seed)}`,
        userToken
      ).catch(() => []),
      crmGet<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>(
        `/offers/coupons?seed=${encodeURIComponent(seed)}`,
        userToken
      ).catch(() => []),
    ]);
    const posterList = Array.isArray(posters) ? posters : (posters.items ?? []);
    const couponList = Array.isArray(coupons) ? coupons : (coupons.items ?? []);
    return mapPromoCards(posterList, couponList, locale, webBaseUrl);
  } catch {
    return [];
  }
}
