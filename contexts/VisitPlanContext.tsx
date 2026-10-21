import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getClientVisitPlan, putClientVisitPlan, type ClientVisitPlan } from '@/api/visit-plan';
import type { Booking } from '@/api/bookings';
import { getHome } from '@/api/home';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';
import { visitPlanNearestUpcomingBookingDate } from '@/utils/visitPlanBookingsHelpers';
import {
  visitPlanCrmReadOnlyFromPlan,
  visitPlanFromCrmToPreferences,
  mergeVisitPlanPrefsForSave,
  visitPlanPutBodyForSave,
  validateVisitPlanProfilePhone,
  validateVisitPlanPutBody,
  type VisitPlanSaveOptions,
} from '@/utils/visitPlanCrmMapping';
import {
  visitPlanCalendarIdealCenterIso,
  visitPlanNextRecommendedCenterAfterUpcoming,
} from '@/utils/visitPlanCalendarHighlights';
import { normalizeIsoDateString, resolveVisitPlanIdealCenterIso, resolveVisitPlanNextTarget } from '@/utils/visitPlanDates';
import {
  getCachedVisitPlanPreferences,
  readVisitPlanPreferencesAsync,
  writeVisitPlanPreferencesAsync,
} from '@/utils/visitPlanStorage';
import { isVisitPlanFirstVisitMode } from '@/utils/visitPlanFirstVisitMode';
import type { VisitPlanPreferences } from '@/utils/visitPlanTypes';

type VisitPlanContextValue = {
  todayIso: string;
  prefs: VisitPlanPreferences;
  loading: boolean;
  saving: boolean;
  saveError: string | null;
  hasStoredPlan: boolean;
  lastCompletedVisitDate: string | null;
  nextTargetVisitDate: string | null;
  nextVisitTarget: string | null;
  idealVisitCenterIso: string;
  /** Střed oranžového okna v kalendáři (po upcoming = upcoming + interval). */
  calendarIdealCenterIso: string;
  nextRecommendedAfterUpcomingIso: string | null;
  upcomingBookingDate: string | null;
  homeBookings: readonly Booking[];
  firstVisitMode: boolean;
  updatePrefs: (next: VisitPlanPreferences) => void;
  savePrefs: (next: VisitPlanPreferences, options?: VisitPlanSaveOptions) => Promise<boolean>;
  reload: (opts?: { silent?: boolean }) => void;
};

const VisitPlanContext = createContext<VisitPlanContextValue | null>(null);

async function mergeLeadTimeFromStorage(prefs: VisitPlanPreferences): Promise<VisitPlanPreferences> {
  const local = await readVisitPlanPreferencesAsync();
  return { ...prefs, leadTime: local.leadTime };
}

export function VisitPlanProvider({ children }: { children: ReactNode }) {
  const { apiToken, isLoading: authLoading, client } = useAuth();
  const { locale } = useLanguage();
  const [prefs, setPrefs] = useState<VisitPlanPreferences>(() => getCachedVisitPlanPreferences());
  const [crmPlan, setCrmPlan] = useState<ClientVisitPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [upcomingBookingDate, setUpcomingBookingDate] = useState<string | null>(null);
  const [homeBookings, setHomeBookings] = useState<Booking[]>([]);
  const loadGen = useRef(0);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const gen = ++loadGen.current;
    if (authLoading) return;

    const localPrefs = await readVisitPlanPreferencesAsync();
    if (gen !== loadGen.current) return;

    if (!apiToken) {
      setCrmPlan(null);
      setPrefs(localPrefs);
      setUpcomingBookingDate(null);
      setHomeBookings([]);
      setLoading(false);
      return;
    }

    if (!opts?.silent) {
      setLoading(true);
    }
    try {
      const [plan, home] = await Promise.all([
        getClientVisitPlan(apiToken),
        getHome({ apiToken, locale, date: getPragueTodayDateString() }).catch(() => null),
      ]);
      if (gen !== loadGen.current) return;

      setCrmPlan(plan);
      const base = visitPlanFromCrmToPreferences(plan, localPrefs);
      const merged = await mergeLeadTimeFromStorage(base);
      if (gen !== loadGen.current) return;
      setPrefs(merged);
      await writeVisitPlanPreferencesAsync(merged);

      const bookings = home?.bookings ?? [];
      setHomeBookings(bookings);
      setUpcomingBookingDate(visitPlanNearestUpcomingBookingDate(bookings));
    } catch {
      if (gen !== loadGen.current) return;
      setPrefs(localPrefs);
    } finally {
      if (gen === loadGen.current) setLoading(false);
    }
  }, [apiToken, authLoading, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback((opts?: { silent?: boolean }) => {
    void load(opts);
  }, [load]);

  const crmReadOnly = useMemo(
    () =>
      crmPlan
        ? visitPlanCrmReadOnlyFromPlan(crmPlan)
        : {
            lastCompletedVisitDate: null,
            nextTargetVisitDate: null,
            updatedAt: null,
            hasStoredPlan: false,
          },
    [crmPlan]
  );

  const planTodayIso = useMemo(() => getPragueTodayDateString(), []);

  const nextVisitTarget = useMemo(
    () =>
      resolveVisitPlanNextTarget({
        crmNextTargetVisitDate: crmReadOnly.nextTargetVisitDate,
        lastCompletedVisitDate: crmReadOnly.lastCompletedVisitDate,
        intervalDays: prefs.intervalDays,
      }),
    [
      crmReadOnly.nextTargetVisitDate,
      crmReadOnly.lastCompletedVisitDate,
      prefs.intervalDays,
    ]
  );

  const idealVisitCenterIso = useMemo(
    () => resolveVisitPlanIdealCenterIso(nextVisitTarget, planTodayIso),
    [nextVisitTarget, planTodayIso]
  );

  const nextRecommendedAfterUpcomingIso = useMemo(() => {
    const upcoming = normalizeIsoDateString(upcomingBookingDate);
    if (!upcoming) return null;
    return visitPlanNextRecommendedCenterAfterUpcoming(upcoming, prefs.intervalDays);
  }, [upcomingBookingDate, prefs.intervalDays]);

  const calendarIdealCenterIso = useMemo(
    () =>
      visitPlanCalendarIdealCenterIso({
        upcomingBookingDate,
        intervalDays: prefs.intervalDays,
        idealVisitCenterIso,
      }),
    [upcomingBookingDate, prefs.intervalDays, idealVisitCenterIso]
  );

  const firstVisitMode = useMemo(
    () =>
      isVisitPlanFirstVisitMode({
        hasStoredPlan: crmReadOnly.hasStoredPlan,
        lastCompletedVisitDate: crmReadOnly.lastCompletedVisitDate,
        upcomingBookingDate,
      }),
    [
      crmReadOnly.hasStoredPlan,
      crmReadOnly.lastCompletedVisitDate,
      upcomingBookingDate,
    ]
  );

  const savePrefs = useCallback(
    async (next: VisitPlanPreferences, options?: VisitPlanSaveOptions): Promise<boolean> => {
      setSaveError(null);
      const scope = options?.scope ?? 'full';
      const draftWithLead = await mergeLeadTimeFromStorage(next);
      const mergedForSave = mergeVisitPlanPrefsForSave(prefs, draftWithLead, scope);
      const withLead = await mergeLeadTimeFromStorage(mergedForSave);
      setPrefs(withLead);
      await writeVisitPlanPreferencesAsync(withLead);

      if (!apiToken) {
        return true;
      }

      const profilePhone = client?.phone?.trim() || null;
      if (!validateVisitPlanProfilePhone(profilePhone)) {
        setSaveError('phone_required');
        return false;
      }

      const body = visitPlanPutBodyForSave(withLead, crmPlan, scope);
      const validationError = validateVisitPlanPutBody(body);
      if (validationError) {
        setSaveError('validation');
        return false;
      }

      setSaving(true);
      try {
        const data = await putClientVisitPlan(apiToken, body);
        setCrmPlan(data);
        const base = visitPlanFromCrmToPreferences(data, withLead);
        const merged = await mergeLeadTimeFromStorage(base);
        setPrefs(merged);
        await writeVisitPlanPreferencesAsync(merged);
        return true;
      } catch {
        setSaveError('save_failed');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiToken, client?.phone, crmPlan, prefs]
  );

  const value = useMemo(
    (): VisitPlanContextValue => ({
      todayIso: planTodayIso,
      prefs,
      loading,
      saving,
      saveError,
      hasStoredPlan: crmReadOnly.hasStoredPlan,
      lastCompletedVisitDate: crmReadOnly.lastCompletedVisitDate,
      nextTargetVisitDate: crmReadOnly.nextTargetVisitDate,
      nextVisitTarget,
      idealVisitCenterIso,
      calendarIdealCenterIso,
      nextRecommendedAfterUpcomingIso,
      upcomingBookingDate,
      homeBookings,
      firstVisitMode,
      updatePrefs: (next) => {
        setSaveError(null);
        void mergeLeadTimeFromStorage(next).then(setPrefs);
      },
      savePrefs,
      reload,
    }),
    [
      crmReadOnly.hasStoredPlan,
      crmReadOnly.lastCompletedVisitDate,
      crmReadOnly.nextTargetVisitDate,
      idealVisitCenterIso,
      calendarIdealCenterIso,
      nextRecommendedAfterUpcomingIso,
      loading,
      nextVisitTarget,
      planTodayIso,
      prefs,
      saveError,
      reload,
      savePrefs,
      saving,
      upcomingBookingDate,
      homeBookings,
      firstVisitMode,
    ]
  );

  return <VisitPlanContext.Provider value={value}>{children}</VisitPlanContext.Provider>;
}

export function useVisitPlan(): VisitPlanContextValue {
  const ctx = useContext(VisitPlanContext);
  if (!ctx) {
    throw new Error('useVisitPlan must be used within VisitPlanProvider');
  }
  return ctx;
}
