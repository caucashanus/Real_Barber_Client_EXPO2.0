import AsyncStorage from '@react-native-async-storage/async-storage';

/** Mobilní storage (odděleně od web localStorage), stejný formát mapy jako web. */
export const VISIT_PLAN_HOME_PROMO_STORAGE_KEY = '@rb_visit_plan_promo_last_shown_v1';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type PromoLastShownMap = Record<string, string>;

async function readPromoLastShownMap(): Promise<PromoLastShownMap> {
  const raw = await AsyncStorage.getItem(VISIT_PLAN_HOME_PROMO_STORAGE_KEY).catch(() => null);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as PromoLastShownMap;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

/** Režim A — home promo, max 1× / 30 dní per client id. */
export async function shouldShowHomeVisitPlanPromo(clientId: string): Promise<boolean> {
  const map = await readPromoLastShownMap();
  const iso = map[clientId];
  if (!iso?.trim()) return true;
  const shownAt = Date.parse(iso);
  if (!Number.isFinite(shownAt)) return true;
  return Date.now() - shownAt >= THIRTY_DAYS_MS;
}

export async function markHomeVisitPlanPromoShown(clientId: string): Promise<void> {
  const map = await readPromoLastShownMap();
  map[clientId] = new Date().toISOString();
  await AsyncStorage.setItem(VISIT_PLAN_HOME_PROMO_STORAGE_KEY, JSON.stringify(map)).catch(
    () => {}
  );
}
