/**
 * DEV: náhled onboardingu plánu návštěv i když CRM už má interval.
 * Před commitem / release vždy `false`.
 */
export const VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW =
  typeof __DEV__ !== 'undefined' && __DEV__ && false;
