import { ALL_BRANCH_INTERNAL_IDS, getBranchContactMeta } from '@/constants/branchContacts';
import type { NearestApiBranch } from '@/lib/branches/postNearestBranches';

const WALK_SPEED_MPS = 1.4;

function haversineMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusM = 6_371_000;
  const dLat = toRad(latitudeB - latitudeA);
  const dLon = toRad(longitudeB - longitudeA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitudeA)) * Math.cos(toRad(latitudeB)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * earthRadiusM * Math.asin(Math.sqrt(a)));
}

/** Fallback when BFF routing fails (simulator abroad, routes API down). */
export function computeNearestBranchesLocally(params: {
  latitude: number;
  longitude: number;
}): NearestApiBranch[] {
  return ALL_BRANCH_INTERNAL_IDS.map((id) => {
    const meta = getBranchContactMeta(id);
    const distanceMeters = haversineMeters(
      params.latitude,
      params.longitude,
      meta.latitude,
      meta.longitude
    );
    return {
      id,
      name: meta.shortLabel,
      drive: null,
      bicycle: null,
      walk: {
        distanceMeters,
        durationSeconds: Math.max(60, Math.round(distanceMeters / WALK_SPEED_MPS)),
      },
    };
  }).sort(
    (a, b) =>
      (a.walk?.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
      (b.walk?.distanceMeters ?? Number.MAX_SAFE_INTEGER)
  );
}
