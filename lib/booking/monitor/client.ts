import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { CrmClient } from '@/api/auth';
import type { BookingRecipeId } from '@/lib/booking/engine/types';
import { resolveBookingMonitorEntry } from '@/lib/booking/monitor/resolveEntry';
import {
  buildBookingMonitorPayload,
  postBookingMonitorPayload,
} from '@/lib/booking/monitor/post';
import type {
  BookingMonitorEntry,
  BookingMonitorEvent,
  HomeFastBookMonitorMode,
  HomeFastBookMonitorPath,
  TrackBookingMonitorFields,
} from '@/lib/booking/monitor/types';

export type PrimeBookingMonitorHomeFastBookParams = {
  mode: HomeFastBookMonitorMode;
  path: HomeFastBookMonitorPath;
};

function authClientDisplayName(client: CrmClient | null | undefined): string | null {
  if (!client) return null;
  const display = client.name?.trim();
  return display || null;
}

function randomSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function bookingMonitorUserAgent(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const platform = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
  return `RB-${platform}/${version}`;
}

let sessionId: string | null = null;
let storedEntry: BookingMonitorEntry | null = null;
let homeFastBookMode: HomeFastBookMonitorMode | null = null;
let homeFastBookPath: HomeFastBookMonitorPath | null = null;
let sessionStarted = false;
let leftSent = false;
let flowActive = false;
let profileClient: CrmClient | null = null;
let fallbackPhone: string | null = null;
let fallbackName: string | null = null;

export function setBookingMonitorIdentity(params: {
  client?: CrmClient | null;
  phone?: string | null;
  clientName?: string | null;
}): void {
  profileClient = params.client ?? null;
  if (params.phone != null) fallbackPhone = params.phone;
  if (params.clientName != null) fallbackName = params.clientName;
}

function readSessionId(): string {
  if (!sessionId) sessionId = randomSessionId();
  return sessionId;
}

function readStoredEntry(): BookingMonitorEntry | null {
  return storedEntry;
}

function storeEntry(entry: BookingMonitorEntry): void {
  storedEntry = entry;
}

function readIdentity(): { clientName: string | null; phone: string | null; userAgent: string } {
  return {
    clientName: authClientDisplayName(profileClient) ?? fallbackName,
    phone: profileClient?.phone?.trim() || fallbackPhone,
    userAgent: bookingMonitorUserAgent(),
  };
}

function readHomeFastBookContext(): {
  mode: HomeFastBookMonitorMode;
  path: HomeFastBookMonitorPath;
} | null {
  const entry = readStoredEntry();
  if (entry !== 'home-fast-book' || !homeFastBookMode || !homeFastBookPath) return null;
  return { mode: homeFastBookMode, path: homeFastBookPath };
}

function dispatch(event: BookingMonitorEvent, fields?: TrackBookingMonitorFields): void {
  const entry = readStoredEntry() ?? 'unknown';
  const payload = buildBookingMonitorPayload(
    event,
    entry,
    readSessionId(),
    fields,
    readIdentity(),
    readHomeFastBookContext()
  );
  void postBookingMonitorPayload(payload, { background: fields?.background });
}

/** Fire-and-forget event → web `/api/booking-monitor` (Telegram formátuje server). */
export function trackBookingMonitor(
  event: BookingMonitorEvent,
  fields?: TrackBookingMonitorFields
): void {
  dispatch(event, fields);
}

export function ensureBookingMonitorSession(params: {
  recipeId: BookingRecipeId | string;
  nearestSlotHandoff?: boolean;
  from?: string | null;
  branchId?: string | null;
  employeeId?: string | null;
  serviceId?: string | null;
}): BookingMonitorEntry {
  flowActive = true;
  leftSent = false;

  readSessionId();

  let entry = readStoredEntry();
  if (!entry) {
    entry = resolveBookingMonitorEntry(params);
    storeEntry(entry);
  } else if (
    params.nearestSlotHandoff &&
    entry !== 'nearest-slot' &&
    entry !== 'home-fast-book'
  ) {
    entry = 'nearest-slot';
    storeEntry(entry);
  }

  return entry;
}

/** Nová booking návštěva z homepage fast-book — před `router.push` do rezervace. */
export function primeBookingMonitorHomeFastBookSession(
  params: PrimeBookingMonitorHomeFastBookParams
): void {
  flowActive = true;
  leftSent = false;
  sessionStarted = false;
  sessionId = randomSessionId();
  storedEntry = 'home-fast-book';
  homeFastBookMode = params.mode;
  homeFastBookPath = params.path;
}

export function trackBookingMonitorSessionStarted(fields?: TrackBookingMonitorFields): void {
  if (sessionStarted) return;
  sessionStarted = true;
  trackBookingMonitor('session_started', fields);
}

export function endBookingMonitorVisitQuietly(): void {
  leftSent = true;
  flowActive = false;
  sessionStarted = false;
  sessionId = null;
  storedEntry = null;
  homeFastBookMode = null;
  homeFastBookPath = null;
}

export function trackBookingMonitorLeftPage(fields?: TrackBookingMonitorFields): void {
  if (leftSent) return;
  leftSent = true;
  flowActive = false;
  sessionStarted = false;
  trackBookingMonitor('left_page', { ...fields, background: true });
}

export function promoteBookingMonitorEntryNearestSlot(): void {
  if (readStoredEntry() === 'home-fast-book') return;
  storeEntry('nearest-slot');
}

export function isBookingMonitorFlowActive(): boolean {
  return flowActive;
}

export function resetBookingMonitorForTests(): void {
  sessionId = null;
  storedEntry = null;
  homeFastBookMode = null;
  homeFastBookPath = null;
  sessionStarted = false;
  leftSent = false;
  flowActive = false;
  profileClient = null;
  fallbackPhone = null;
  fallbackName = null;
}

export function getBookingMonitorEntryForTests(): BookingMonitorEntry | null {
  return storedEntry;
}
