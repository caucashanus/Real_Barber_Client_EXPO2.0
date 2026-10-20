import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_SEEN_KEY = '@rb_visit_plan_intro_sheet_seen';

export async function readVisitPlanIntroSheetSeen(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(INTRO_SEEN_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function markVisitPlanIntroSheetSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}
