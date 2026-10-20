import AsyncStorage from '@react-native-async-storage/async-storage';

import { clampVisitPlanIntervalDays } from '@/utils/visitPlanIntervalDisplay';
import {
  clampVisitPlanIntervalWeeks,
  DEFAULT_VISIT_PLAN_PREFERENCES,
  type VisitPlanContactMethod,
  type VisitPlanContactRemind,
  type VisitPlanLeadTime,
  type VisitPlanPreferences,
} from '@/utils/visitPlanTypes';

const STORAGE_KEY = '@rb_visit_plan_prefs_v1';

let memoryCache: VisitPlanPreferences | null = null;

function isLeadTime(v: unknown): v is VisitPlanLeadTime {
  return v === '3_days_before' || v === '1_week_before' || v === '2_week_before';
}

function normalizeLeadTime(v: unknown): VisitPlanLeadTime {
  if (isLeadTime(v)) return v;
  if (v === 'same_day' || v === '1_day_before') return '3_days_before';
  return DEFAULT_VISIT_PLAN_PREFERENCES.leadTime;
}

function normalizeContactRemind(
  parsed: Partial<VisitPlanPreferences> & {
    contactMethod?: VisitPlanContactMethod | 'phone_call';
  }
): VisitPlanContactRemind {
  const raw = parsed.contactRemind;
  if (raw && typeof raw === 'object') {
    const sms = raw.sms === true;
    const phone = raw.phone === true;
    if (sms || phone) {
      return { sms, phone };
    }
  }

  const legacy = parsed.contactMethod;
  if (legacy === 'phone' || legacy === 'phone_call') {
    return { sms: false, phone: true };
  }
  if (legacy === 'sms') {
    return { sms: true, phone: false };
  }

  return { ...DEFAULT_VISIT_PLAN_PREFERENCES.contactRemind };
}

function readIntervalDays(
  parsed: Partial<VisitPlanPreferences> & { intervalWeeks?: number }
): number {
  if (typeof parsed.intervalDays === 'number') {
    return clampVisitPlanIntervalDays(parsed.intervalDays);
  }
  if (typeof parsed.intervalWeeks === 'number') {
    return clampVisitPlanIntervalDays(
      clampVisitPlanIntervalWeeks(parsed.intervalWeeks) * 7
    );
  }
  return DEFAULT_VISIT_PLAN_PREFERENCES.intervalDays;
}

export function getCachedVisitPlanPreferences(): VisitPlanPreferences {
  return memoryCache ?? DEFAULT_VISIT_PLAN_PREFERENCES;
}

export async function readVisitPlanPreferencesAsync(): Promise<VisitPlanPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryCache = DEFAULT_VISIT_PLAN_PREFERENCES;
      return DEFAULT_VISIT_PLAN_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Partial<VisitPlanPreferences> & {
      intervalWeeks?: number;
      contactMethod?: VisitPlanContactMethod | 'phone_call';
    };
    const prefs: VisitPlanPreferences = {
      intervalDays: readIntervalDays(parsed),
      contactRemind: normalizeContactRemind(parsed),
      leadTime: normalizeLeadTime(parsed.leadTime),
    };
    memoryCache = prefs;
    return prefs;
  } catch {
    memoryCache = DEFAULT_VISIT_PLAN_PREFERENCES;
    return DEFAULT_VISIT_PLAN_PREFERENCES;
  }
}

export async function writeVisitPlanPreferencesAsync(
  prefs: VisitPlanPreferences
): Promise<void> {
  memoryCache = prefs;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
