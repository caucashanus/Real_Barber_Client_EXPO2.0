import { LISTING_TTL_MS } from '@/lib/availability/listingCache';

export const BRANCH_PAGE_INCLUDE = 'core,employees,nearestSlots,reviews,stats' as const;

/** Dočasně vypnuto — sekce „Jak se k nám dostanete?“ (video) na detailu pobočky. */
export const BRANCH_DIRECTIONS_VIDEO_ENABLED = false;

export const BRANCH_PAGE_DAYS = 14;
export const BRANCH_PAGE_REVIEWS_LIMIT = 4;
export const BRANCH_PAGE_CACHE_MS = LISTING_TTL_MS;
