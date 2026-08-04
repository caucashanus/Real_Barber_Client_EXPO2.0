import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { ALL_BRANCH_INTERNAL_IDS } from '@/constants/branchContacts';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { NearestApiBranch } from '@/lib/branches/postNearestBranches';
import { postNearestBranches } from '@/lib/branches/postNearestBranches';
import { resolveCoarseUserLocationLabel } from '@/utils/formatCoarseUserLocation';

export type NearestBranchError = 'denied' | 'unavailable' | 'failed';

const LOCATION_TIMEOUT_MS = 12_000;
const LAST_KNOWN_MAX_AGE_MS = 60_000;

type ResolveResult = {
  nearest: NearestApiBranch | null;
  error: NearestBranchError | null;
  userLocationLabel: string | null;
};

let sessionNearest: NearestApiBranch | null = null;
let sessionLocationLabel: string | null = null;
let sessionError: NearestBranchError | null = null;
let inFlight: Promise<ResolveResult> | null = null;

function isBranchInternalId(id: string): id is BranchInternalId {
  return ALL_BRANCH_INTERNAL_IDS.includes(id as BranchInternalId);
}

async function readGrantedCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('location_denied');
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('location_unavailable');
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown && Date.now() - lastKnown.timestamp <= LAST_KNOWN_MAX_AGE_MS) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
  }

  const position = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('location_timeout')), LOCATION_TIMEOUT_MS);
    }),
  ]);

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

async function readDeviceCoordinatesWithRequest(): Promise<{ latitude: number; longitude: number }> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('location_unavailable');
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('location_denied');
  }

  return readGrantedCoordinates();
}

function mapFetchError(error: unknown): NearestBranchError {
  const code = error instanceof Error ? error.message : '';
  if (code === 'location_denied') return 'denied';
  if (code === 'location_unavailable') return 'unavailable';
  return 'failed';
}

async function fetchNearestAtCoordinates(
  coords: { latitude: number; longitude: number }
): Promise<ResolveResult> {
  const result = await postNearestBranches(coords);

  if (!result.ok) {
    return { nearest: null, error: 'failed', userLocationLabel: null };
  }

  const first = result.branches[0];
  if (!first?.id || !isBranchInternalId(first.id)) {
    return { nearest: null, error: 'failed', userLocationLabel: null };
  }

  const userLocationLabel =
    (await resolveCoarseUserLocationLabel(coords.latitude, coords.longitude)) || null;

  return { nearest: first, error: null, userLocationLabel };
}

async function runNearestResolve(requestPermission: boolean): Promise<ResolveResult> {
  try {
    const coords = requestPermission
      ? await readDeviceCoordinatesWithRequest()
      : await readGrantedCoordinates();
    return await fetchNearestAtCoordinates(coords);
  } catch (err) {
    if (__DEV__) console.warn('[nearest-branch] resolve failed', err);
    return { nearest: null, error: mapFetchError(err), userLocationLabel: null };
  }
}

function applySession(result: ResolveResult) {
  sessionNearest = result.nearest;
  sessionLocationLabel = result.userLocationLabel;
  sessionError = result.error;
}

async function ensureNearest(requestPermission: boolean): Promise<ResolveResult> {
  if (sessionNearest && !sessionError) {
    return {
      nearest: sessionNearest,
      error: sessionError,
      userLocationLabel: sessionLocationLabel,
    };
  }

  if (!inFlight) {
    inFlight = runNearestResolve(requestPermission).finally(() => {
      inFlight = null;
    });
  }

  const result = await inFlight;
  applySession(result);
  return result;
}

export function useNearestBranch() {
  const [nearest, setNearest] = useState<NearestApiBranch | null>(sessionNearest);
  const [error, setError] = useState<NearestBranchError | null>(sessionError);
  const [userLocationLabel, setUserLocationLabel] = useState<string | null>(sessionLocationLabel);
  const [loading, setLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  const applyResult = useCallback((result: ResolveResult) => {
    setNearest(result.nearest);
    setError(result.error);
    setUserLocationLabel(result.userLocationLabel);
  }, []);

  const prefetchNearest = useCallback(
    async (options?: { force?: boolean }) => {
      const permission = await Location.getForegroundPermissionsAsync();
      const granted = permission.status === 'granted';
      setHasLocationPermission(granted);

      if (!granted) {
        applyResult({
          nearest: sessionNearest,
          error: sessionError,
          userLocationLabel: sessionLocationLabel,
        });
        return;
      }

      if (options?.force) {
        sessionNearest = null;
        sessionLocationLabel = null;
        sessionError = null;
        inFlight = null;
      }

      if (sessionNearest && !sessionError && !options?.force) {
        applyResult({
          nearest: sessionNearest,
          error: sessionError,
          userLocationLabel: sessionLocationLabel,
        });
        return;
      }

      setLoading(true);
      try {
        const result = await ensureNearest(false);
        applyResult(result);
      } finally {
        setLoading(false);
      }
    },
    [applyResult]
  );

  const resolveNearest = useCallback(async () => {
    if (sessionNearest && !sessionError) {
      applyResult({
        nearest: sessionNearest,
        error: sessionError,
        userLocationLabel: sessionLocationLabel,
      });
      setHasLocationPermission(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await runNearestResolve(true);
      applySession(result);
      applyResult(result);
      setHasLocationPermission(result.error !== 'denied');
    } finally {
      setLoading(false);
    }
  }, [applyResult]);

  const resetSession = useCallback(() => {
    sessionNearest = null;
    sessionLocationLabel = null;
    sessionError = null;
    inFlight = null;
    setNearest(null);
    setError(null);
    setUserLocationLabel(null);
  }, []);

  return {
    nearest,
    error,
    loading,
    userLocationLabel,
    hasLocationPermission,
    prefetchNearest,
    resolveNearest,
    resetSession,
  };
}
