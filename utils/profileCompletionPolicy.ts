import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ProfileCompletionStepId } from '@/constants/profileCompletionSchema';
import { APP_OPENS_KEY } from '@/constants/appOpens';

/** Dočasně vypnuto — viz docs/profile-completion-sheet.md */
export const PROFILE_COMPLETION_SHEET_ENABLED = false;

export const PROFILE_COMPLETION_LAST_PROMPT_KEY = '@profile_completion_last_prompt_at';
export const PROFILE_COMPLETION_DISMISSED_UNTIL_KEY = '@profile_completion_dismissed_until';

/** V dev buildu (`expo run:ios`) bez cooldownu — v produkci 14 / 30 dní. */
export const PROFILE_COMPLETION_GLOBAL_COOLDOWN_MS = __DEV__
  ? 0
  : 14 * 24 * 60 * 60 * 1000;
export const PROFILE_COMPLETION_DISMISS_MS = __DEV__ ? 0 : 30 * 24 * 60 * 60 * 1000;
export const PROFILE_COMPLETION_MIN_APP_OPENS = __DEV__ ? 0 : 2;

type DismissedUntilMap = Partial<Record<ProfileCompletionStepId, number>>;

async function readDismissedUntil(): Promise<DismissedUntilMap> {
  const raw = await AsyncStorage.getItem(PROFILE_COMPLETION_DISMISSED_UNTIL_KEY).catch(() => null);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as DismissedUntilMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeDismissedUntil(map: DismissedUntilMap): Promise<void> {
  await AsyncStorage.setItem(PROFILE_COMPLETION_DISMISSED_UNTIL_KEY, JSON.stringify(map)).catch(
    () => {}
  );
}

export async function getAppOpensCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(APP_OPENS_KEY).catch(() => null);
  return parseInt(raw ?? '0', 10) || 0;
}

export async function isProfileCompletionStepDismissed(
  stepId: ProfileCompletionStepId,
  now = Date.now()
): Promise<boolean> {
  const map = await readDismissedUntil();
  const until = map[stepId];
  return typeof until === 'number' && until > now;
}

export async function dismissProfileCompletionStep(
  stepId: ProfileCompletionStepId,
  now = Date.now()
): Promise<void> {
  const map = await readDismissedUntil();
  map[stepId] = now + PROFILE_COMPLETION_DISMISS_MS;
  await writeDismissedUntil(map);
}

export async function getLastProfileCompletionPromptAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(PROFILE_COMPLETION_LAST_PROMPT_KEY).catch(() => null);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function recordProfileCompletionPromptShown(now = Date.now()): Promise<void> {
  await AsyncStorage.setItem(PROFILE_COMPLETION_LAST_PROMPT_KEY, String(now)).catch(() => {});
}

export async function canShowProfileCompletionPrompt(now = Date.now()): Promise<boolean> {
  const [opens, lastPromptAt] = await Promise.all([
    getAppOpensCount(),
    getLastProfileCompletionPromptAt(),
  ]);

  if (opens < PROFILE_COMPLETION_MIN_APP_OPENS) return false;
  if (lastPromptAt == null) return true;
  return now - lastPromptAt >= PROFILE_COMPLETION_GLOBAL_COOLDOWN_MS;
}
