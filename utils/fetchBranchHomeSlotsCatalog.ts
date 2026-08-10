import type { HomeResponse } from '@/api/home';
import { getHome } from '@/api/home';
import type { Locale } from '@/contexts/LanguageContext';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { TranslationKey } from '@/locales';
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

const CACHE_MS = 60_000;

let cachedCatalog: Record<BranchInternalId, NearestBranchHomeSlot[]> | null = null;
let cachedAt = 0;
let cacheKey = '';

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
  cacheKey = `${apiToken}:${locale}:${todayIso}`;
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
  const key = `${apiToken}:${locale}:${todayIso}`;
  if (!force && cachedCatalog && cacheKey === key && Date.now() - cachedAt < CACHE_MS) {
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
