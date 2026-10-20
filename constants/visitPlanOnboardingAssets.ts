/** Parita s web `visitPlanOnboardingAssets.ts` — lokální assety v app bundle. */
export const VISIT_PLAN_ONBOARDING_HERO_VIDEO = require('@/assets/img/visit-plan/onboarding/onboarding-hero-video.mp4');

export const VISIT_PLAN_ONBOARDING_STRESS_FREE_VIDEO = require('@/assets/img/visit-plan/onboarding/onboarding-hero.mp4');

export const VISIT_PLAN_ONBOARDING_BENEFIT_REMINDER = require('@/assets/img/visit-plan/onboarding/onboarding-benefit-reminder.webp');

export const VISIT_PLAN_ONBOARDING_BENEFIT_IDEAL_DAYS = require('@/assets/img/visit-plan/onboarding/onboarding-benefit-ideal-days.webp');

export const VISIT_PLAN_INTRO_BANNER = require('@/assets/img/visit-plan/muj-plan-navstev-banner.png');

import type { VisitPlanPageBannerImageVariant } from '@/utils/visitPlanPageBannerImage';

export const VISIT_PLAN_PAGE_BANNER_DEFAULT = require('@/assets/img/visit-plan/muj-plan-navstev-banner-page.png');

export const VISIT_PLAN_PAGE_BANNER_URGENT = require('@/assets/img/visit-plan/page-banner-do-3-dni-nebo-po-terminu.webp');

export const VISIT_PLAN_PAGE_BANNER_RELAXED = require('@/assets/img/visit-plan/page-banner-nad-10-dni.webp');

/** @deprecated Use visitPlanPageBannerImageSource */
export const VISIT_PLAN_PAGE_BANNER = VISIT_PLAN_PAGE_BANNER_DEFAULT;

export function visitPlanPageBannerImageSource(variant: VisitPlanPageBannerImageVariant) {
  if (variant === 'urgent') return VISIT_PLAN_PAGE_BANNER_URGENT;
  if (variant === 'relaxed') return VISIT_PLAN_PAGE_BANNER_RELAXED;
  return VISIT_PLAN_PAGE_BANNER_DEFAULT;
}
