import AsyncStorage from '@react-native-async-storage/async-storage';

/** Parita s webem: wallet_referral_promo_dismissed */
export const WALLET_REFERRAL_PROMO_DISMISSED_KEY = 'wallet_referral_promo_dismissed';
export const WALLET_REFERRAL_PROMO_ID = 'referral-dashboard';
export const WALLET_REFERRAL_PROMO_HIDE_MS = 24 * 60 * 60 * 1000;

type DismissMap = Record<string, number>;

function parseDismissMap(raw: string | null): DismissMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const next: DismissMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      const ts = typeof value === 'number' ? value : Number(value);
      if (typeof key === 'string' && Number.isFinite(ts)) next[key] = ts;
    }
    return next;
  } catch {
    return {};
  }
}

/** Odstraní záznamy starší než 24 h (parita s webem). */
function pruneDismissMap(map: DismissMap, nowMs: number = Date.now()): DismissMap {
  const next: DismissMap = {};
  for (const [key, ts] of Object.entries(map)) {
    if (nowMs - ts < WALLET_REFERRAL_PROMO_HIDE_MS) next[key] = ts;
  }
  return next;
}

export function isWalletReferralPromoDismissed(
  dismissedAt: number | null,
  nowMs: number = Date.now()
): boolean {
  if (dismissedAt == null) return false;
  return nowMs - dismissedAt < WALLET_REFERRAL_PROMO_HIDE_MS;
}

export async function readWalletReferralPromoDismissedAt(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY);
    const pruned = pruneDismissMap(parseDismissMap(raw));
    await AsyncStorage.setItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY, JSON.stringify(pruned));

    const ts = pruned[WALLET_REFERRAL_PROMO_ID];
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export async function saveWalletReferralPromoDismissedAt(nowMs: number = Date.now()): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY);
    const map = pruneDismissMap(parseDismissMap(raw));
    map[WALLET_REFERRAL_PROMO_ID] = nowMs;
    await AsyncStorage.setItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY, JSON.stringify(map));
  } catch {
    /* ignore when native module unavailable */
  }
}

/** Smaže dismiss referral banneru (dev / QA reset). */
export async function clearWalletReferralPromoDismiss(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WALLET_REFERRAL_PROMO_DISMISSED_KEY);
    await AsyncStorage.removeItem('wallet_referral_promo_dismissed_at');
  } catch {
    /* ignore */
  }
}
