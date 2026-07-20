/** Same value as web `NEXT_PUBLIC_HOME_AVAILABILITY_SERVICE_ID` (set in `.env` as EXPO_PUBLIC_HOME_AVAILABILITY_SERVICE_ID). */
export const HOME_AVAILABILITY_SERVICE_ID =
  process.env.EXPO_PUBLIC_HOME_AVAILABILITY_SERVICE_ID ?? '';

export const TEAM_MEMBER_PAGE_INCLUDE =
  'core,shiftCalendar,stats,favoriteServices,reviews,stories,media' as const;

export const TEAM_MEMBER_PAGE_DAYS = 14;
export const TEAM_MEMBER_PAGE_REVIEWS_LIMIT = 4;
export const TEAM_MEMBER_PAGE_STORIES_LIMIT = 6;
export const TEAM_MEMBER_PAGE_MEDIA_LIMIT = 12;
export const TEAM_MEMBER_PAGE_CACHE_MS = 5 * 60 * 1000;
