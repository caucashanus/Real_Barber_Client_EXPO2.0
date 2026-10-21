import { describe, expect, it } from 'vitest';

import { normalizeClientVisitPlan } from '@/api/visit-plan';
import {
  mergeVisitPlanPrefsForSave,
  visitPlanFromCrmToPreferences,
  visitPlanHasStoredPlan,
  visitPlanPutBodyForSave,
} from '@/utils/visitPlanCrmMapping';
import { DEFAULT_VISIT_PLAN_PREFERENCES } from '@/utils/visitPlanTypes';

describe('normalizeClientVisitPlan', () => {
  it('maps legacy remind flags to remindersEnabled', () => {
    expect(
      normalizeClientVisitPlan({
        intervalDays: 20,
        remindersEnabled: null,
        remindBySms: false,
        remindByPhone: true,
        lastCompletedVisitDate: null,
        nextTargetVisitDate: null,
        updatedAt: null,
      }).remindersEnabled
    ).toBe(true);
  });

  it('prefers explicit remindersEnabled over legacy', () => {
    expect(
      normalizeClientVisitPlan({
        intervalDays: 20,
        remindersEnabled: false,
        remindBySms: true,
        remindByPhone: true,
        lastCompletedVisitDate: null,
        nextTargetVisitDate: null,
        updatedAt: null,
      }).remindersEnabled
    ).toBe(false);
  });
});

describe('visitPlanFromCrmToPreferences', () => {
  it('applies remindersEnabled false from CRM', () => {
    const prefs = visitPlanFromCrmToPreferences(
      {
        intervalDays: 14,
        remindersEnabled: false,
        lastCompletedVisitDate: '2026-10-01',
        nextTargetVisitDate: '2026-10-15',
        updatedAt: '2026-10-21T12:00:00+02:00',
      },
      DEFAULT_VISIT_PLAN_PREFERENCES
    );
    expect(prefs.remindersEnabled).toBe(false);
    expect(prefs.intervalDays).toBe(14);
  });

  it('intervalOnly PUT keeps CRM reminders when draft differs', () => {
    const current = { ...DEFAULT_VISIT_PLAN_PREFERENCES, intervalDays: 14, remindersEnabled: false };
    const draft = { ...current, intervalDays: 21, remindersEnabled: true };
    const merged = mergeVisitPlanPrefsForSave(current, draft, 'intervalOnly');
    expect(merged.intervalDays).toBe(21);
    expect(merged.remindersEnabled).toBe(false);

    const body = visitPlanPutBodyForSave(
      merged,
      {
        intervalDays: 14,
        remindersEnabled: false,
        lastCompletedVisitDate: null,
        nextTargetVisitDate: null,
        updatedAt: null,
      },
      'intervalOnly'
    );
    expect(body).toEqual({ intervalDays: 21, remindersEnabled: false });
  });

  it('treats stored interval as plan even if reminders were null', () => {
    expect(
      visitPlanHasStoredPlan({
        intervalDays: 21,
        remindersEnabled: null,
        lastCompletedVisitDate: null,
        nextTargetVisitDate: null,
        updatedAt: null,
      })
    ).toBe(true);
  });
});
