import { describe, expect, it } from 'vitest';

import { cs } from '@/locales/cs';
import type { TranslationKey } from '@/locales';
import {
  formatVisitPlanIntervalEvery,
  visitPlanIntervalEveryMessage,
} from '@/utils/visitPlanIntervalDisplay';

const tCs = (key: TranslationKey) => cs[key];

describe('visitPlanIntervalEveryMessage', () => {
  it('uses weeks for whole multiples of 7', () => {
    expect(visitPlanIntervalEveryMessage(7)).toEqual({ kind: 'weeks', count: 1 });
    expect(visitPlanIntervalEveryMessage(21)).toEqual({ kind: 'weeks', count: 3 });
  });

  it('uses days for non-week values', () => {
    expect(visitPlanIntervalEveryMessage(15)).toEqual({ kind: 'days', count: 15 });
    expect(visitPlanIntervalEveryMessage(4)).toEqual({ kind: 'days', count: 4 });
  });
});

describe('formatVisitPlanIntervalEvery (cs)', () => {
  it('formats weeks like web keys', () => {
    expect(formatVisitPlanIntervalEvery(7, tCs)).toBe('Každý 1 týden');
    expect(formatVisitPlanIntervalEvery(21, tCs)).toBe('Každé 3 týdny');
    expect(formatVisitPlanIntervalEvery(35, tCs)).toBe('Každých 5 týdnů');
  });

  it('formats days with one/few/many', () => {
    expect(formatVisitPlanIntervalEvery(4, tCs)).toBe('Každé 4 dny');
    expect(formatVisitPlanIntervalEvery(15, tCs)).toBe('Každých 15 dní');
  });
});
