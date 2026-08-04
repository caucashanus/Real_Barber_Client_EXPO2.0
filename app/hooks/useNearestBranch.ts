import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { ALL_BRANCH_INTERNAL_IDS } from '@/constants/branchContacts';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { NearestApiBranch } from '@/lib/branches/postNearestBranches';
import { postNearestBranches } from '@/lib/branches/postNearestBranches';

export type NearestBranchError = 'denied' | 'unavailable' | 'failed';

const LOCATION_TIMEOUT_MS = 12_000;
const LAST_KNOWN_MAX_AGE_MS = 60_000;

type ResolveResult = {
  nearest: NearestApiBranch | null;
  error: NearestBranchError | null;
};

let sessionNearest: NearestApiBranch | null = null;
let inFlight: Promise<ResolveResult> | null = null;

function isBranchInternalId(id: string): id is BranchInternalId {
  return ALL_BRANCH_INTERNAL_IDS.includes(id as BranchInternalId);
}

async function readDeviceCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('location_unavailable');
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('location_denied');
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown && Date.now() - lastKnown.timestamp <= LAST_KNOWN_MAX_AGE_MS) {
    const coords = {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
    if (__DEV__) console.log('[nearest-branch] lastKnown coords', coords);
    return coords;
  }

  if (__DEV__) console.log('[nearest-branch] requesting current position…');

  const position = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('location_timeout')), LOCATION_TIMEOUT_MS);
    }),
  ]);

  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  if (__DEV__) console.log('[nearest-branch] current coords', coords);
  return coords;
}

function mapFetchError(error: unknown): NearestBranchError {
  const code = error instanceof Error ? error.message : '';
  if (code === 'location_denied') return 'denied';
  if (code === 'location_unavailable') return 'unavailable';
  return 'failed';
}

async function fetchNearestFromDevice(): Promise<NearestApiBranch> {
  const coords = await readDeviceCoordinates();
  const result = await postNearestBranches(coords);

  if (!result.ok) {
    throw new Error(`nearest_${result.error}`);
  }

  const first = result.branches[0];
  if (!first?.id || !isBranchInternalId(first.id)) {
    throw new Error('nearest_empty');
  }

  return first;
}

export function useNearestBranch() {
  const [nearest, setNearest] = useState<NearestApiBranch | null>(sessionNearest);
  const [error, setError] = useState<NearestBranchError | null>(null);

  const resolveNearest = useCallback(async () => {
    if (sessionNearest) {
      setNearest(sessionNearest);
      setError(null);
      return;
    }

    if (!inFlight) {
      setError(null);
      setNearest(null);

      inFlight = (async (): Promise<ResolveResult> => {
        try {
          const branch = await fetchNearestFromDevice();
          sessionNearest = branch;
          return { nearest: branch, error: null };
        } catch (err) {
          sessionNearest = null;
          if (__DEV__) console.warn('[nearest-branch] resolve failed', err);
          return { nearest: null, error: mapFetchError(err) };
        } finally {
          inFlight = null;
        }
      })();
    }

    const result = await inFlight;
    setNearest(result.nearest);
    setError(result.error);
  }, []);

  const resetSession = useCallback(() => {
    sessionNearest = null;
    setNearest(null);
    setError(null);
  }, []);

  return { nearest, error, resolveNearest, resetSession };
}
