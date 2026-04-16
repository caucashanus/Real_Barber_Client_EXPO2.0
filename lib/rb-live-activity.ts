import { NativeModules, Platform } from 'react-native';

export type RBLiveActivityPhase = 'scheduled' | 'active' | 'finished';
export type RBLiveActivityPresentation = 'normal' | 'rescheduled' | 'cancelled' | 'review';

export type RBLiveActivityState = {
  phase: RBLiveActivityPhase;
  presentation: RBLiveActivityPresentation;
  labelText?: string;
  headlineText?: string;
  detailText?: string;
  startAt: string;
  endAt: string;
  branchName?: string;
  timeRangeText?: string;
  employeeName?: string;
  employeeAvatarUrl?: string;
  employeeAvatarBase64?: string;
  employeeAvatarAuthToken?: string;
  accentHex?: string;
  priceFormatted?: string;
};

type NativePayload = {
  phase: string;
  presentation: string;
  labelText: string;
  headlineText: string;
  detailText: string;
  startAt: string;
  endAt: string;
  branchName: string;
  timeRangeText: string;
  employeeName: string;
  employeeAvatarUrl: string;
  employeeAvatarBase64: string;
  employeeAvatarAuthToken: string;
  accentHex: string;
  priceFormatted: string;
};

type Bridge = {
  startReservationActivity: (
    payload: NativePayload,
    bookingId: string,
    deepLink: string
  ) => Promise<string>;
  getLiveActivityPushToken: (activityId: string) => Promise<string | null>;
  updateReservationActivity: (activityId: string, payload: NativePayload) => Promise<void>;
  endReservationActivity: (activityId: string) => Promise<void>;
  updateReservationActivitiesForBooking: (
    bookingId: string,
    payload: NativePayload
  ) => Promise<number>;
  endReservationActivitiesForBooking: (bookingId: string) => Promise<number>;
  cleanupReservationActivities: (keepBookingIds: string[]) => Promise<number>;
  endAllReservationActivities: () => Promise<void>;
  getReservationActivityCount: () => Promise<number>;
};

function toNativePayload(state: RBLiveActivityState): NativePayload {
  const rawAccent = state.accentHex?.replace(/^\s+|\s+$/g, '') ?? '';
  const accentHex = /^#[0-9A-Fa-f]{6}$/.test(rawAccent) ? rawAccent : '';
  return {
    phase: state.phase,
    presentation: state.presentation,
    labelText: state.labelText ?? '',
    headlineText: state.headlineText ?? '',
    detailText: state.detailText ?? '',
    startAt: state.startAt,
    endAt: state.endAt,
    branchName: state.branchName ?? '',
    timeRangeText: state.timeRangeText ?? '',
    employeeName: state.employeeName ?? '',
    employeeAvatarUrl: state.employeeAvatarUrl ?? '',
    employeeAvatarBase64: state.employeeAvatarBase64 ?? '',
    employeeAvatarAuthToken: state.employeeAvatarAuthToken ?? '',
    accentHex,
    priceFormatted: state.priceFormatted ?? '',
  };
}

function getBridge(): Bridge | undefined {
  if (Platform.OS !== 'ios') return undefined;
  return NativeModules.RBActivityBridge as Bridge | undefined;
}

export class RBLiveActivityHandle {
  constructor(
    readonly id: string,
    readonly bookingId: string
  ) {}

  update(state: RBLiveActivityState) {
    return rbLiveActivityUpdate(this.id, state);
  }

  end() {
    return rbLiveActivityEnd(this.id);
  }
}

export async function rbLiveActivityStart(
  bookingId: string,
  state: RBLiveActivityState,
  deepLink: string
): Promise<RBLiveActivityHandle> {
  const bridge = getBridge();
  if (!bridge) {
    throw new Error('RBActivityBridge is not available (iOS native module missing).');
  }
  const id = await bridge.startReservationActivity(toNativePayload(state), bookingId, deepLink);
  return new RBLiveActivityHandle(id, bookingId);
}

export async function rbLiveActivityUpdate(id: string, state: RBLiveActivityState) {
  const bridge = getBridge();
  if (!bridge) return;
  await bridge.updateReservationActivity(id, toNativePayload(state));
}

export async function rbLiveActivityUpdateForBooking(
  bookingId: string,
  state: RBLiveActivityState
): Promise<number> {
  const bridge = getBridge();
  if (!bridge?.updateReservationActivitiesForBooking) return 0;
  return bridge.updateReservationActivitiesForBooking(bookingId, toNativePayload(state));
}

export async function rbLiveActivityEnd(id: string) {
  const bridge = getBridge();
  if (!bridge) return;
  await bridge.endReservationActivity(id);
}

export async function rbLiveActivityEndForBooking(bookingId: string): Promise<number> {
  const bridge = getBridge();
  if (!bridge?.endReservationActivitiesForBooking) return 0;
  return bridge.endReservationActivitiesForBooking(bookingId);
}

export async function rbLiveActivityCleanup(keepBookingIds: string[]): Promise<number> {
  const bridge = getBridge();
  if (!bridge?.cleanupReservationActivities) return 0;
  return bridge.cleanupReservationActivities(keepBookingIds);
}

export async function rbLiveActivityEndAll() {
  const bridge = getBridge();
  if (!bridge) return;
  await bridge.endAllReservationActivities();
}

export async function rbLiveActivityGetCount(): Promise<number> {
  const bridge = getBridge();
  if (!bridge) return 0;
  return bridge.getReservationActivityCount();
}

export async function rbLiveActivityGetPushToken(activityId: string): Promise<string | null> {
  const bridge = getBridge();
  if (!bridge?.getLiveActivityPushToken) return null;
  const raw = await bridge.getLiveActivityPushToken(activityId);
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function rbLiveActivityWaitForPushToken(
  activityId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<string | null> {
  const maxAttempts = options?.maxAttempts ?? 80;
  const intervalMs = options?.intervalMs ?? 200;
  for (let i = 0; i < maxAttempts; i++) {
    const token = await rbLiveActivityGetPushToken(activityId);
    if (token) return token;
    await sleep(intervalMs);
  }
  return null;
}
