import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { teamMemberWaitlistSessionKey } from '@/utils/teamMemberWaitlist';

const STORAGE_KEY = 'rb-team-waitlist-joined';

const joinedKeys = new Set<string>();
const listeners = new Set<() => void>();
let hydratePromise: Promise<void> | null = null;

function notifyWaitlistSessionChanged(): void {
  listeners.forEach((listener) => listener());
}

async function readStoredJoinedKeys(): Promise<Record<string, true>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, true>;
  } catch {
    return {};
  }
}

/** Načte uložené klíče (employee + den) — volat při mountu gridu / detailu. */
export function ensureTeamMemberWaitlistSessionHydrated(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = readStoredJoinedKeys().then((stored) => {
      for (const key of Object.keys(stored)) {
        joinedKeys.add(key);
      }
    });
  }
  return hydratePromise;
}

export function subscribeTeamMemberWaitlistSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Už zapsán na čekací listinu pro holiče + den (stejný klíč jako web). */
export function isTeamMemberWaitlistJoined(
  employeeId: string,
  dayIso?: string | null
): boolean {
  return joinedKeys.has(teamMemberWaitlistSessionKey(employeeId, dayIso));
}

/** @deprecated alias */
export const isHomeTodayWaitlistJoined = isTeamMemberWaitlistJoined;

export async function markTeamMemberWaitlistJoined(
  employeeId: string,
  dayIso?: string | null
): Promise<void> {
  const key = teamMemberWaitlistSessionKey(employeeId, dayIso);
  joinedKeys.add(key);

  try {
    const stored = await readStoredJoinedKeys();
    stored[key] = true;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Lokální stav v paměti stačí pro aktuální session.
  }

  notifyWaitlistSessionChanged();
}

/** @deprecated alias */
export const markHomeTodayWaitlistJoined = markTeamMemberWaitlistJoined;

export async function clearTeamMemberWaitlistSession(): Promise<void> {
  joinedKeys.clear();
  hydratePromise = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  notifyWaitlistSessionChanged();
}

/** @deprecated alias */
export const clearHomeTodayWaitlistSession = clearTeamMemberWaitlistSession;

/** Reaktivní stav „už zapsán“ pro kartu / detail. */
export function useTeamMemberWaitlistJoined(
  employeeId: string,
  dayIso?: string | null
): boolean {
  const key = teamMemberWaitlistSessionKey(employeeId, dayIso);
  const [joined, setJoined] = useState(() => joinedKeys.has(key));

  useEffect(() => {
    let cancelled = false;

    void ensureTeamMemberWaitlistSessionHydrated().then(() => {
      if (!cancelled) setJoined(joinedKeys.has(key));
    });

    return subscribeTeamMemberWaitlistSession(() => {
      setJoined(joinedKeys.has(key));
    });
  }, [key]);

  return joined;
}
