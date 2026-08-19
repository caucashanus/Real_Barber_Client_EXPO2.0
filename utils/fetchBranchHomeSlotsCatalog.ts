import type { HomeResponse } from '@/api/home';
import { getHome } from '@/api/home';
import type { Locale } from '@/contexts/LanguageContext';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { TranslationKey } from '@/locales';
import {
  ackListingFetch,
  shouldRefetchListing,
} from '@/lib/availability/listingCache';
import {
  buildHomeTodayTeamCards,
  mergeTodayTeamWithAvailability,
  type HomeTodayTeamCardModel,
} from '@/utils/homeTodayTeamHelpers';
import {
  buildNearestBranchSlotsByInternalId,
  emptyNearestBranchSlots,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

let cachedCatalog: Record<BranchInternalId, NearestBranchHomeSlot[]> | null = null;
let cachedAt = 0;
let cacheKey = '';

function homeCatalogCacheKey(apiToken: string, locale: Locale, todayIso: string): string {
  return `home:catalog:${todayIso}:${locale}:${apiToken}`;
}

export type FetchBranchHomeSlotsCatalogParams = {
  apiToken: string;
  locale: Locale;
  t: (key: TranslationKey) => string;
  todayIso?: string;
  force?: boolean;
};

export function warmBranchHomeSlotsCatalog(
  cards: HomeTodayTeamCardModel[],
  locale: Locale,
  apiToken: string,
  todayIso: string
): Record<BranchInternalId, NearestBranchHomeSlot[]> {
  const catalog = buildNearestBranchSlotsByInternalId(cards, locale);
  cachedCatalog = catalog;
  cachedAt = Date.now();
  cacheKey = homeCatalogCacheKey(apiToken, locale, todayIso);
  ackListingFetch(cacheKey);
  return catalog;
}

export function warmBranchHomeSlotsCatalogFromHomeResponse(
  data: HomeResponse,
  locale: Locale,
  t: (key: TranslationKey) => string,
  apiToken: string,
  todayIso: string
): Record<BranchInternalId, NearestBranchHomeSlot[]> {
  const members = mergeTodayTeamWithAvailability(data.todayTeam ?? [], data.availability);
  const cards = buildHomeTodayTeamCards({ members, locale, t });
  return warmBranchHomeSlotsCatalog(cards, locale, apiToken, todayIso);
}

export async function fetchBranchHomeSlotsCatalog({
  apiToken,
  locale,
  t,
  todayIso = getPragueTodayDateString(),
  force = false,
}: FetchBranchHomeSlotsCatalogParams): Promise<Record<BranchInternalId, NearestBranchHomeSlot[]>> {
  const key = homeCatalogCacheKey(apiToken, locale, todayIso);
  if (
    !shouldRefetchListing(key, cachedAt, { force }) &&
    cachedCatalog &&
    cacheKey === key
  ) {
    return cachedCatalog;
  }

  try {
    const data = await getHome({ date: todayIso, locale, apiToken });
    const members = mergeTodayTeamWithAvailability(data.todayTeam ?? [], data.availability);
    const cards = buildHomeTodayTeamCards({ members, locale, t });
    const catalog = buildNearestBranchSlotsByInternalId(cards, locale);
    cachedCatalog = catalog;
    cachedAt = Date.now();
    cacheKey = key;
    ackListingFetch(key);
    return catalog;
  } catch {
    return emptyNearestBranchSlots();
  }
}

export function getBranchHomeSlotsFromCatalog(
  catalog: Record<BranchInternalId, NearestBranchHomeSlot[]>,
  internalId: BranchInternalId
): NearestBranchHomeSlot[] {
  return catalog[internalId] ?? [];
}
