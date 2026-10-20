/** Výška bloku dole — parita s web PhotoOnboardingScreen (CTA + mezera nad ním). */
export const VISIT_PLAN_ONBOARDING_CTA_HEIGHT = 52;
export const VISIT_PLAN_ONBOARDING_CTA_TOP_GAP = 24;

export function visitPlanOnboardingFooterReserveHeight(): number {
  return VISIT_PLAN_ONBOARDING_CTA_HEIGHT + VISIT_PLAN_ONBOARDING_CTA_TOP_GAP;
}
