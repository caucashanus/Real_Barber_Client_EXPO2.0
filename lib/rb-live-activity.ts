import { NativeModules, Platform } from 'react-native';

/**
 * Live Activity content. Native order: small caption (`subtitle`) → big headline (`title`) → progress bar → branch → detail line.
 */
export type RBLiveActivityProps = {
  /** Small gray caption above the headline (Bolt-style). */
  subtitle?: string;
  /** Large headline (e.g. "12 min"). */
  title: string;
  startAt: string;
  endAt: string;
  employeeName?: string;
  employeeAvatarUrl?: string;
  /** PNG/JPEG bytes as standard base64; fallback, když nestačí stažení z URL (malé soubory). */
  employeeAvatarBase64?: string;
  /** Bearer pro stažení `employeeAvatarUrl` na native straně (neukládá se do ActivityKit state). */
  employeeAvatarAuthToken?: string;
  branchName?: string;
  /** Line under branch (e.g. "10:30–10:45"). */
  detailLine?: string;
  /** Např. „450 Kč“ pro upcoming řádek pobočka · jméno · … · cena */
  priceFormatted?: string;
  /** 0…1 fill; values &lt; 0 hide the progress bar. */
  progress01?: number;
  /** `#RRGGBB` z nastavení barevnosti; prázdné = černobílý fallback na Live Activity. */
  accentHex?: string;
};

type NativePayload = {
  subtitle: string;
  title: string;
  branchName: string;
  detailLine: string;
  startAt: string;
  endAt: string;
  employeeName: string;
  employeeAvatarUrl: string;
  employeeAvatarBase64: string;
  employeeAvatarAuthToken: string;
  progress: number;
  accentHex: string;
  priceFormatted: string;
};

type Bridge = {
  startReservationActivity: (payload: NativePayload, deepLink: string) => Promise<string>;
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

function toNativePayload(props: RBLiveActivityProps): NativePayload {
  const raw = props.accentHex?.replace(/^\s+|\s+$/g, '') ?? '';
  const accentHex = /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : '';
  return {
    subtitle: props.subtitle ?? '',
    title: props.title,
    branchName: props.branchName ?? '',
    detailLine: props.detailLine ?? '',
    startAt: props.startAt,
    endAt: props.endAt,
    employeeName: props.employeeName ?? '',
    employeeAvatarUrl: props.employeeAvatarUrl ?? '',
    employeeAvatarBase64: props.employeeAvatarBase64 ?? '',
    employeeAvatarAuthToken: props.employeeAvatarAuthToken ?? '',
    progress: props.progress01 ?? -1,
    accentHex,
    priceFormatted: props.priceFormatted ?? '',
  };
}

function getBridge(): Bridge | undefined {
  if (Platform.OS !== 'ios') return undefined;
  return NativeModules.RBActivityBridge as Bridge | undefined;
}

/** Handle returned from {@link rbLiveActivityStart}. */
export class RBLiveActivityHandle {
  constructor(readonly id: string) {}

  update(props: RBLiveActivityProps) {
    return rbLiveActivityUpdate(this.id, props);
  }

  end() {
    return rbLiveActivityEnd(this.id);
  }
}

export async function rbLiveActivityStart(
  props: RBLiveActivityProps,
  deepLink: string
): Promise<RBLiveActivityHandle> {
  const bridge = getBridge();
  if (!bridge) {
    throw new Error('RBActivityBridge is not available (iOS native module missing).');
  }
  const id = await bridge.startReservationActivity(toNativePayload(props), deepLink);
  return new RBLiveActivityHandle(id);
}

export async function rbLiveActivityUpdate(id: string, props: RBLiveActivityProps) {
  const bridge = getBridge();
  if (!bridge) return;
  await bridge.updateReservationActivity(id, toNativePayload(props));
}

/**
 * Best-effort: update any Live Activity whose deepLink bookingId matches `bookingId`.
 * Useful for immediate lock-screen feedback after reschedule, even when server won't send remote updates (>60min).
 */
export async function rbLiveActivityUpdateForBooking(
  bookingId: string,
  props: RBLiveActivityProps
): Promise<number> {
  const bridge = getBridge();
  if (!bridge?.updateReservationActivitiesForBooking) return 0;
  return bridge.updateReservationActivitiesForBooking(bookingId, toNativePayload(props));
}

export async function rbLiveActivityEnd(id: string) {
  const bridge = getBridge();
  if (!bridge) return;
  await bridge.endReservationActivity(id);
}

/**
 * Best-effort: end any Live Activity whose deepLink bookingId matches `bookingId`.
 * Useful after reschedule/cancel, and for cleaning up stale activities after app restart.
 */
export async function rbLiveActivityEndForBooking(bookingId: string): Promise<number> {
  const bridge = getBridge();
  if (!bridge?.endReservationActivitiesForBooking) return 0;
  return bridge.endReservationActivitiesForBooking(bookingId);
}

/**
 * Best-effort: end all Live Activities except those whose bookingId is in `keepBookingIds`.
 */
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

/**
 * ActivityKit push token (hex) pro APNs `apns-push-type: liveactivity`.
 * Po `start` může pár set ms chybět — použij {@link rbLiveActivityWaitForPushToken}.
 */
export async function rbLiveActivityGetPushToken(activityId: string): Promise<string | null> {
  const bridge = getBridge();
  if (!bridge?.getLiveActivityPushToken) return null;
  const raw = await bridge.getLiveActivityPushToken(activityId);
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Čeká na první ActivityKit push token po startu aktivity (polling).
 */
export async function rbLiveActivityWaitForPushToken(
  activityId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<string | null> {
  const maxAttempts = options?.maxAttempts ?? 80;
  const intervalMs = options?.intervalMs ?? 200;
  for (let i = 0; i < maxAttempts; i++) {
    const t = await rbLiveActivityGetPushToken(activityId);
    if (t) return t;
    await sleep(intervalMs);
  }
  return null;
}
