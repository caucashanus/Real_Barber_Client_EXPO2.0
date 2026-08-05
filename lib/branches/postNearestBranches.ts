import { WEB_BFF_ORIGIN } from '@/constants/bookingMonitor';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import { computeNearestBranchesLocally } from '@/lib/branches/nearestBranchLocal';

export type NearestBranchTravel = {
  distanceMeters: number;
  durationSeconds: number;
  trafficAware?: boolean;
};

export type NearestApiBranch = {
  id: BranchInternalId;
  name: string;
  drive: NearestBranchTravel | null;
  walk: NearestBranchTravel | null;
  bicycle: NearestBranchTravel | null;
};

export type PostNearestBranchesResult =
  | { ok: true; branches: NearestApiBranch[] }
  | { ok: false; error: 'network' | 'failed' | 'not_configured' | 'rate_limited' };

export async function postNearestBranches(params: {
  latitude: number;
  longitude: number;
}): Promise<PostNearestBranchesResult> {
  const url = `${WEB_BFF_ORIGIN}/api/branches/nearest/`;
  try {
    if (__DEV__) {
      console.log('[nearest-branch] POST', url, params);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    });

    if (res.status === 429) return { ok: false, error: 'rate_limited' };
    if (res.status === 503) return { ok: false, error: 'not_configured' };
    if (!res.ok) {
      if (__DEV__) console.warn('[nearest-branch] HTTP', res.status, url);
      const fallbackBranches = computeNearestBranchesLocally(params);
      if (__DEV__) {
        console.log('[nearest-branch] local fallback', fallbackBranches[0]?.id);
      }
      return { ok: true, branches: fallbackBranches };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      if (__DEV__) console.warn('[nearest-branch] non-JSON response', contentType, url);
      return { ok: true, branches: computeNearestBranchesLocally(params) };
    }

    const data = (await res.json()) as { branches?: NearestApiBranch[] };
    const branches = Array.isArray(data.branches) ? data.branches : [];
    if (!branches.length || !branches[0]?.id) {
      if (__DEV__) console.warn('[nearest-branch] empty branches', data);
      return { ok: true, branches: computeNearestBranchesLocally(params) };
    }
    if (__DEV__) console.log('[nearest-branch] OK', branches[0]?.id, branches[0]?.name);
    return { ok: true, branches };
  } catch (err) {
    if (__DEV__) console.warn('[nearest-branch] network error', url, err);
    return { ok: true, branches: computeNearestBranchesLocally(params) };
  }
}
