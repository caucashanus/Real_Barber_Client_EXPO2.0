import * as Location from 'expo-location';

import { getBranchContactMeta } from '@/constants/branchContacts';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { NearestApiBranch } from '@/lib/branches/postNearestBranches';
import { postNearestBranches } from '@/lib/branches/postNearestBranches';

export function buildMinimalBranchTravel(internalId: BranchInternalId): NearestApiBranch {
  const meta = getBranchContactMeta(internalId);
  return {
    id: internalId,
    name: meta.shortLabel,
    drive: null,
    walk: null,
    bicycle: null,
  };
}

export async function fetchBranchTravelInfo(
  branchInternalId: BranchInternalId
): Promise<NearestApiBranch> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return buildMinimalBranchTravel(branchInternalId);
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return buildMinimalBranchTravel(branchInternalId);
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const result = await postNearestBranches({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    if (result.ok) {
      const found = result.branches.find((branch) => branch.id === branchInternalId);
      if (found) return found;
    }
  } catch {
    // fall through to minimal travel
  }

  return buildMinimalBranchTravel(branchInternalId);
}
