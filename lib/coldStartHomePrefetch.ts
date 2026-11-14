import { getHome, type HomeResponse } from '@/api/home';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

export type ColdStartHomePrefetchParams = {
  date: string;
  locale: string;
  apiToken?: string | null;
};

let inflight: Promise<HomeResponse | null> | null = null;
let cached: HomeResponse | null = null;

export function startColdStartHomePrefetch(params: ColdStartHomePrefetchParams): Promise<HomeResponse | null> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = getHome({
    date: params.date,
    locale: params.locale,
    apiToken: params.apiToken,
  })
    .then((data) => {
      cached = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function hasColdStartHomePrefetch(): boolean {
  return cached != null;
}

/** Jednou přečíst prefetch pro `useHomePage` — další request jde normálně přes hook. */
export function consumeColdStartHomePrefetch(): HomeResponse | null {
  const data = cached;
  if (data) cached = null;
  return data;
}

export function defaultColdStartHomePrefetchDate(): string {
  return getPragueTodayDateString();
}