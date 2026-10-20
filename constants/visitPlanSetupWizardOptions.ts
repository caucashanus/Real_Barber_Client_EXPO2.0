import type {
  VisitPlanFreshnessPreference,
  VisitPlanGrowthRate,
  VisitPlanHairLength,
} from '@/utils/visitPlanRecommendationTable';

export const VISIT_PLAN_SETUP_HAIR_ICON_IMAGES = {
  very_short: require('@/assets/img/visit-plan/hair-very-short.webp'),
  short: require('@/assets/img/visit-plan/hair-short.webp'),
  medium: require('@/assets/img/visit-plan/hair-medium.webp'),
  longer: require('@/assets/img/visit-plan/hair-longer.webp'),
  very_long: require('@/assets/img/visit-plan/hair-very-long.webp'),
} as const;

export type VisitPlanSetupHairLengthKey = keyof typeof VISIT_PLAN_SETUP_HAIR_ICON_IMAGES;

export const VISIT_PLAN_SETUP_HAIR_OPTIONS: readonly {
  value: VisitPlanHairLength;
  labelKey: 'visitPlanSetupHairVeryShort' | 'visitPlanSetupHairShort' | 'visitPlanSetupHairMedium' | 'visitPlanSetupHairLonger' | 'visitPlanSetupHairVeryLong';
  descKey:
    | 'visitPlanSetupHairVeryShortDesc'
    | 'visitPlanSetupHairShortDesc'
    | 'visitPlanSetupHairMediumDesc'
    | 'visitPlanSetupHairLongerDesc'
    | 'visitPlanSetupHairVeryLongDesc';
  icon: (typeof VISIT_PLAN_SETUP_HAIR_ICON_IMAGES)[VisitPlanSetupHairLengthKey];
}[] = [
  {
    value: 'very_short',
    labelKey: 'visitPlanSetupHairVeryShort',
    descKey: 'visitPlanSetupHairVeryShortDesc',
    icon: VISIT_PLAN_SETUP_HAIR_ICON_IMAGES.very_short,
  },
  {
    value: 'short',
    labelKey: 'visitPlanSetupHairShort',
    descKey: 'visitPlanSetupHairShortDesc',
    icon: VISIT_PLAN_SETUP_HAIR_ICON_IMAGES.short,
  },
  {
    value: 'medium',
    labelKey: 'visitPlanSetupHairMedium',
    descKey: 'visitPlanSetupHairMediumDesc',
    icon: VISIT_PLAN_SETUP_HAIR_ICON_IMAGES.medium,
  },
  {
    value: 'longer',
    labelKey: 'visitPlanSetupHairLonger',
    descKey: 'visitPlanSetupHairLongerDesc',
    icon: VISIT_PLAN_SETUP_HAIR_ICON_IMAGES.longer,
  },
  {
    value: 'very_long',
    labelKey: 'visitPlanSetupHairVeryLong',
    descKey: 'visitPlanSetupHairVeryLongDesc',
    icon: VISIT_PLAN_SETUP_HAIR_ICON_IMAGES.very_long,
  },
];

export const VISIT_PLAN_SETUP_GROWTH_OPTIONS: readonly {
  value: VisitPlanGrowthRate;
  labelKey: 'visitPlanSetupGrowthSlow' | 'visitPlanSetupGrowthNormal' | 'visitPlanSetupGrowthFast';
  descKey:
    | 'visitPlanSetupGrowthSlowDesc'
    | 'visitPlanSetupGrowthNormalDesc'
    | 'visitPlanSetupGrowthFastDesc';
  icon: number;
}[] = [
  {
    value: 'slow',
    labelKey: 'visitPlanSetupGrowthSlow',
    descKey: 'visitPlanSetupGrowthSlowDesc',
    icon: require('@/assets/img/my-haircuts/growth-slow.png'),
  },
  {
    value: 'normal',
    labelKey: 'visitPlanSetupGrowthNormal',
    descKey: 'visitPlanSetupGrowthNormalDesc',
    icon: require('@/assets/img/my-haircuts/growth-normal.png'),
  },
  {
    value: 'fast',
    labelKey: 'visitPlanSetupGrowthFast',
    descKey: 'visitPlanSetupGrowthFastDesc',
    icon: require('@/assets/img/my-haircuts/growth-fast.png'),
  },
];

export const VISIT_PLAN_SETUP_FRESHNESS_OPTIONS: readonly {
  value: VisitPlanFreshnessPreference;
  labelKey:
    | 'visitPlanSetupFreshPerfect'
    | 'visitPlanSetupFreshBalanced'
    | 'visitPlanSetupFreshGrownOk';
  descKey:
    | 'visitPlanSetupFreshPerfectDesc'
    | 'visitPlanSetupFreshBalancedDesc'
    | 'visitPlanSetupFreshGrownOkDesc';
  icon: number;
}[] = [
  {
    value: 'perfect',
    labelKey: 'visitPlanSetupFreshPerfect',
    descKey: 'visitPlanSetupFreshPerfectDesc',
    icon: require('@/assets/img/visit-plan/fresh-perfect.webp'),
  },
  {
    value: 'balanced',
    labelKey: 'visitPlanSetupFreshBalanced',
    descKey: 'visitPlanSetupFreshBalancedDesc',
    icon: require('@/assets/img/visit-plan/fresh-balanced.webp'),
  },
  {
    value: 'grown_ok',
    labelKey: 'visitPlanSetupFreshGrownOk',
    descKey: 'visitPlanSetupFreshGrownOkDesc',
    icon: require('@/assets/img/visit-plan/fresh-grown-ok.webp'),
  },
];

export const VISIT_PLAN_SETUP_WIZARD_STEPS = 5 as const;

export const VISIT_PLAN_INTERVAL_ICON = require('@/assets/img/visit-plan/muj-plan-navstev-ikonka.png');

export const VISIT_PLAN_CELEBRATION_ICON = require('@/assets/img/my-haircuts/gratulations.png');
