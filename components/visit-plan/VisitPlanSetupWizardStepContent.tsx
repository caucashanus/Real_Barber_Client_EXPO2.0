import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import VisitPlanChoiceCarousel from '@/components/visit-plan/VisitPlanChoiceCarousel';
import VisitPlanIntervalWheelPicker from '@/components/visit-plan/VisitPlanIntervalWheelPicker';
import {
  VISIT_PLAN_CELEBRATION_ICON,
  VISIT_PLAN_SETUP_FRESHNESS_OPTIONS,
  VISIT_PLAN_SETUP_GROWTH_OPTIONS,
  VISIT_PLAN_SETUP_HAIR_OPTIONS,
} from '@/constants/visitPlanSetupWizardOptions';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatVisitPlanIntervalEvery } from '@/utils/visitPlanIntervalDisplay';
import type { VisitPlanSetupAnswers } from '@/utils/visitPlanRecommendationTable';

type Props = {
  stepIndex: number;
  answers: VisitPlanSetupAnswers;
  onSelectHair: (value: VisitPlanSetupAnswers['hairLength'] | null) => void;
  onSelectGrowth: (value: VisitPlanSetupAnswers['growthRate'] | null) => void;
  onSelectFreshness: (value: VisitPlanSetupAnswers['freshness'] | null) => void;
  recommendedDays: number | null;
  intervalDays: number;
  onIntervalDaysChange: (days: number) => void;
};

export default function VisitPlanSetupWizardStepContent({
  stepIndex,
  answers,
  onSelectHair,
  onSelectGrowth,
  onSelectFreshness,
  recommendedDays,
  intervalDays,
  onIntervalDaysChange,
}: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  const hairOptions = useMemo(
    () =>
      VISIT_PLAN_SETUP_HAIR_OPTIONS.map((opt) => ({
        value: opt.value,
        title: t(opt.labelKey),
        description: t(opt.descKey),
        icon: opt.icon,
      })),
    [t]
  );

  const growthOptions = useMemo(
    () =>
      VISIT_PLAN_SETUP_GROWTH_OPTIONS.map((opt) => ({
        value: opt.value,
        title: t(opt.labelKey),
        description: t(opt.descKey),
        icon: opt.icon,
      })),
    [t]
  );

  const freshOptions = useMemo(
    () =>
      VISIT_PLAN_SETUP_FRESHNESS_OPTIONS.map((opt) => ({
        value: opt.value,
        title: t(opt.labelKey),
        description: t(opt.descKey),
        icon: opt.icon,
      })),
    [t]
  );

  switch (stepIndex) {
    case 0:
      return (
        <VisitPlanChoiceCarousel
          options={hairOptions}
          value={answers.hairLength}
          onChange={(v) => onSelectHair(v)}
        />
      );
    case 1:
      return (
        <VisitPlanChoiceCarousel
          options={growthOptions}
          value={answers.growthRate}
          onChange={(v) => onSelectGrowth(v)}
        />
      );
    case 2:
      return (
        <VisitPlanChoiceCarousel
          options={freshOptions}
          value={answers.freshness}
          onChange={(v) => onSelectFreshness(v)}
        />
      );
    case 3:
      return (
        <View className="w-full max-w-sm items-center">
          {recommendedDays != null ? (
            <ThemedText className="text-center text-3xl font-bold">
              {formatVisitPlanIntervalEvery(recommendedDays, t)}
            </ThemedText>
          ) : null}
          <ThemedText className="mt-3 w-full text-center text-base text-light-subtext dark:text-dark-subtext">
            {t('visitPlanSetupIntervalStepHint')}
          </ThemedText>
          <View className="mt-6 w-full items-center">
            <VisitPlanIntervalWheelPicker
              size="lg"
              days={intervalDays}
              onDaysChange={onIntervalDaysChange}
            />
          </View>
        </View>
      );
    case 4:
      return (
        <View className="flex-1 items-center justify-center py-10">
          <Image source={VISIT_PLAN_CELEBRATION_ICON} style={{ width: 128, height: 128 }} contentFit="contain" />
          <ThemedText className="mt-8 text-center text-3xl font-bold">
            {t('visitPlanSetupCelebrationTitle')}
          </ThemedText>
          <ThemedText className="mt-2 max-w-sm text-center text-base text-light-subtext dark:text-dark-subtext">
            {t('visitPlanSetupCelebrationMessage')}
          </ThemedText>
        </View>
      );
    default:
      return null;
  }
}
