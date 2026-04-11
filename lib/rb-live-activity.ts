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
  branchName?: string;
  /** Line under branch (e.g. "10:30–10:45"). */
  detailLine?: string;
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
  progress: number;
  accentHex: string;
};

type Bridge = {
  startReservationActivity: (payload: NativePayload, deepLink: string) => Promise<string>;
  updateReservationActivity: (activityId: string, payload: NativePayload) => Promise<void>;
  endReservationActivity: (activityId: string) => Promise<void>;
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
    progress: props.progress01 ?? -1,
    accentHex,
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

export async function rbLiveActivityEnd(id: string) {
  const bridge = getBridge();
  if (!bridge) return;
  await bridge.endReservationActivity(id);
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
