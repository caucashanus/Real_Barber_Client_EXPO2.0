import { CRM_BASE } from '@/api/http';

import { getHome } from '@/api/home';

import {
  mapBranchCards,
  mapHomePromoFeedToPromoCards,
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
import { homePromoClientSeed } from '@/utils/homePromoCoupon';
import { buildHomePromoFeed, filterHomePromoFeedWithImages } from '@/utils/homePromoFeed';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

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
  const today = getPragueTodayDateString();
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
  _webBaseUrl = RBICEK_WEB_BASE_URL
): Promise<PromoCardData[]> {
  try {
    const home = await getHome({
      date: getPragueTodayDateString(),
      locale,
      apiToken: userToken,
    });
    const clientSeed = homePromoClientSeed(userId ?? userToken ?? '');
    const feed = buildHomePromoFeed(home.posters, home.coupons, {
      nowMs: Date.now(),
      clientSeed,
    });
    return mapHomePromoFeedToPromoCards(filterHomePromoFeedWithImages(feed), locale);
  } catch {
    return [];
  }
}
