import { clampVisitPlanIntervalWeeks } from '@/utils/visitPlanTypes';

export const VISIT_PLAN_HAIR_LENGTHS = [
  'very_short',
  'short',
  'medium',
  'longer',
  'very_long',
] as const;

export type VisitPlanHairLength = (typeof VISIT_PLAN_HAIR_LENGTHS)[number];

export const VISIT_PLAN_GROWTH_RATES = ['slow', 'normal', 'fast'] as const;

export type VisitPlanGrowthRate = (typeof VISIT_PLAN_GROWTH_RATES)[number];

export const VISIT_PLAN_FRESHNESS_PREFERENCES = ['perfect', 'balanced', 'grown_ok'] as const;

export type VisitPlanFreshnessPreference = (typeof VISIT_PLAN_FRESHNESS_PREFERENCES)[number];

export type VisitPlanSetupAnswers = {
  hairLength: VisitPlanHairLength | null;
  growthRate: VisitPlanGrowthRate | null;
  freshness: VisitPlanFreshnessPreference | null;
};

const BASE_WEEKS_BY_HAIR: Record<VisitPlanHairLength, number> = {
  very_short: 2,
  short: 2,
  medium: 3,
  longer: 4,
  very_long: 5,
};

const GROWTH_WEEK_DELTA: Record<VisitPlanGrowthRate, number> = {
  slow: 1,
  normal: 0,
  fast: -1,
};

const FRESHNESS_WEEK_DELTA: Record<VisitPlanFreshnessPreference, number> = {
  perfect: -1,
  balanced: 0,
  grown_ok: 1,
};

export function recommendVisitPlanIntervalWeeks(answers: VisitPlanSetupAnswers): number | null {
  const { hairLength, growthRate, freshness } = answers;
  if (!hairLength || !growthRate || !freshness) return null;

  const raw =
    BASE_WEEKS_BY_HAIR[hairLength] +
    GROWTH_WEEK_DELTA[growthRate] +
    FRESHNESS_WEEK_DELTA[freshness];

  return clampVisitPlanIntervalWeeks(raw);
}

export function recommendVisitPlanIntervalDays(answers: VisitPlanSetupAnswers): number | null {
  const weeks = recommendVisitPlanIntervalWeeks(answers);
  if (weeks == null) return null;
  return weeks * 7;
}
