import AsyncStorage from '@react-native-async-storage/async-storage';

/** Max 1 feedback sheet za hodinu po zavření (odděleně pro přidání / odebrání). */
export const FAVORITE_FEEDBACK_SHEET_COOLDOWN_MS = 60 * 60 * 1000;

const STORAGE_KEY = '@favorite_feedback_sheet_closed_at';

export type FavoriteFeedbackSheetKind = 'add' | 'remove';

type StoredTimestamps = Partial<Record<FavoriteFeedbackSheetKind, number>>;

async function readStored(): Promise<StoredTimestamps> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== 'object') return {};
    return parsed as StoredTimestamps;
  } catch {
    return {};
  }
}

async function writeStored(next: StoredTimestamps): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

/** Sheet smí vyjet jen pokud od posledního zavření tohoto typu uplynula hodina. */
export async function shouldShowFavoriteFeedbackSheet(
  kind: FavoriteFeedbackSheetKind,
  nowMs: number = Date.now()
): Promise<boolean> {
  const stored = await readStored();
  const lastClosed = stored[kind];
  if (lastClosed == null || !Number.isFinite(lastClosed)) return true;
  return nowMs - lastClosed >= FAVORITE_FEEDBACK_SHEET_COOLDOWN_MS;
}

/** Volat až po zavření sheetu (swipe, tlačítko, navigace na oblíbené). */
export async function markFavoriteFeedbackSheetClosed(
  kind: FavoriteFeedbackSheetKind,
  nowMs: number = Date.now()
): Promise<void> {
  const stored = await readStored();
  await writeStored({ ...stored, [kind]: nowMs });
}
