import { describe, expect, it } from 'vitest';

import {
  shouldRunVisitPlanHomeSilentReload,
  VISIT_PLAN_HOME_SILENT_RELOAD_MS,
} from '@/utils/visitPlanHomeReloadThrottle';

describe('shouldRunVisitPlanHomeSilentReload', () => {
  it('runs when never reloaded', () => {
    expect(shouldRunVisitPlanHomeSilentReload(0, 100_000)).toBe(true);
  });

  it('skips within throttle window', () => {
    const now = 200_000;
    const last = now - VISIT_PLAN_HOME_SILENT_RELOAD_MS + 1;
    expect(shouldRunVisitPlanHomeSilentReload(last, now)).toBe(false);
  });

  it('runs after throttle window', () => {
    const now = 200_000;
    const last = now - VISIT_PLAN_HOME_SILENT_RELOAD_MS;
    expect(shouldRunVisitPlanHomeSilentReload(last, now)).toBe(true);
  });
});
