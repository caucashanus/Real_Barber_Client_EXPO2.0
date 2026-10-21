import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { putClientVisitPlan } from '@/api/visit-plan';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import VisitPlanGate from '@/components/visit-plan/VisitPlanGate';
import VisitPlanRoot from '@/components/visit-plan/VisitPlanRoot';
import VisitPlanSetupWizardStepContent from '@/components/visit-plan/VisitPlanSetupWizardStepContent';
import { VISIT_PLAN_SETUP_WIZARD_STEPS } from '@/constants/visitPlanSetupWizardOptions';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  validateVisitPlanProfilePhone,
  validateVisitPlanPutBody,
} from '@/utils/visitPlanCrmMapping';
import { clampVisitPlanIntervalDays } from '@/utils/visitPlanIntervalDisplay';
import {
  recommendVisitPlanIntervalDays,
  type VisitPlanSetupAnswers,
} from '@/utils/visitPlanRecommendationTable';
import { writeVisitPlanPreferencesAsync } from '@/utils/visitPlanStorage';
import {
  DEFAULT_VISIT_PLAN_PREFERENCES,
} from '@/utils/visitPlanTypes';

const LAST_STEP_INDEX = VISIT_PLAN_SETUP_WIZARD_STEPS - 1;

const INITIAL_ANSWERS: VisitPlanSetupAnswers = {
  hairLength: null,
  growthRate: null,
  freshness: null,
};

function SetupBody() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { apiToken, client } = useAuth();
  const { reload } = useVisitPlan();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<VisitPlanSetupAnswers>(INITIAL_ANSWERS);
  const [intervalDays, setIntervalDays] = useState(DEFAULT_VISIT_PLAN_PREFERENCES.intervalDays);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isCelebrationStep = stepIndex === LAST_STEP_INDEX;
  const isChoiceStep = stepIndex <= 2;
  const isIntervalStep = stepIndex === 3;
  const recommendedDays = useMemo(() => recommendVisitPlanIntervalDays(answers), [answers]);

  const nextDisabled = useMemo(() => {
    if (stepIndex === 0) return answers.hairLength == null;
    if (stepIndex === 1) return answers.growthRate == null;
    if (stepIndex === 2) return answers.freshness == null;
    if (stepIndex === 3) return recommendedDays == null;
    return false;
  }, [stepIndex, answers, recommendedDays]);

  const savePlan = useCallback(async (): Promise<boolean> => {
    if (!apiToken) return false;
    const days = clampVisitPlanIntervalDays(intervalDays);
    if (!validateVisitPlanProfilePhone(client?.phone)) {
      setSubmitError(t('visitPlanSavePhoneRequired'));
      return false;
    }

    const body = {
      intervalDays: days,
      remindersEnabled: true,
    };
    if (validateVisitPlanPutBody(body)) {
      setSubmitError(t('visitPlanSetupSaveError'));
      return false;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await putClientVisitPlan(apiToken, body);
      await writeVisitPlanPreferencesAsync({
        ...DEFAULT_VISIT_PLAN_PREFERENCES,
        intervalDays: days,
        remindersEnabled: true,
      });
      reload();
      return true;
    } catch {
      setSubmitError(t('visitPlanSetupSaveError'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [apiToken, client?.phone, intervalDays, reload, t]);

  const goNext = useCallback(async () => {
    if (nextDisabled || submitting) return;

    if (stepIndex === 2 && recommendedDays != null) {
      setIntervalDays(recommendedDays);
    }

    if (stepIndex === 3) {
      const ok = await savePlan();
      if (!ok) return;
      setStepIndex(LAST_STEP_INDEX);
      return;
    }

    if (stepIndex >= LAST_STEP_INDEX) {
      router.replace('/screens/visit-plan');
      return;
    }

    setStepIndex((i) => Math.min(i + 1, LAST_STEP_INDEX));
  }, [nextDisabled, submitting, stepIndex, recommendedDays, savePlan]);

  const footerLabel = useMemo(() => {
    if (isCelebrationStep) return t('visitPlanSetupGoToPlan');
    if (stepIndex === 3) return t('visitPlanIntervalSheetSave');
    return t('visitPlanOnboardingHeroCta');
  }, [isCelebrationStep, stepIndex, t]);

  const stepTitle = useMemo(() => {
    if (stepIndex === 0) return t('visitPlanSetupStepHairTitle');
    if (stepIndex === 1) return t('visitPlanSetupStepGrowthTitle');
    if (stepIndex === 2) return t('visitPlanSetupStepFreshTitle');
    if (stepIndex === 3) return t('visitPlanSetupIntervalStepTitle');
    return '';
  }, [stepIndex, t]);

  const safeBottomPad = Math.max(insets.bottom, 8);

  const stepHeading = !isCelebrationStep ? (
    <View className={isIntervalStep ? 'w-full' : undefined}>
      <ThemedText
        className={`mt-2 text-2xl font-semibold ${isIntervalStep ? 'mx-auto max-w-sm text-center' : ''}`}>
        {stepTitle}
      </ThemedText>
      {isChoiceStep ? (
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {t('visitPlanSetupStepSingleSelect')}
        </ThemedText>
      ) : null}
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      {!isCelebrationStep ? (
        <Header
          showBackButton
          onBackPress={() => {
            if (stepIndex === 0) {
              router.replace('/screens/visit-plan-onboarding-intro');
              return;
            }
            setStepIndex((i) => i - 1);
          }}
        />
      ) : (
        <View className="h-14" />
      )}

      {isChoiceStep ? (
        <View className="min-h-0 flex-1 px-global">
          {stepHeading}
          {submitError ? (
            <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">{submitError}</ThemedText>
          ) : null}
          <View className="-mx-global mt-8 min-h-0 flex-1">
            <VisitPlanSetupWizardStepContent
              stepIndex={stepIndex}
              answers={answers}
              onSelectHair={(hairLength) => setAnswers((a) => ({ ...a, hairLength }))}
              onSelectGrowth={(growthRate) => setAnswers((a) => ({ ...a, growthRate }))}
              onSelectFreshness={(freshness) => setAnswers((a) => ({ ...a, freshness }))}
              recommendedDays={recommendedDays}
              intervalDays={intervalDays}
              onIntervalDaysChange={setIntervalDays}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-global"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 16,
            ...(isIntervalStep ? { alignItems: 'center' as const } : {}),
          }}>
          {stepHeading}
          {submitError ? (
            <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">{submitError}</ThemedText>
          ) : null}
          <View className="mt-4">
            <VisitPlanSetupWizardStepContent
              stepIndex={stepIndex}
              answers={answers}
              onSelectHair={(hairLength) => setAnswers((a) => ({ ...a, hairLength }))}
              onSelectGrowth={(growthRate) => setAnswers((a) => ({ ...a, growthRate }))}
              onSelectFreshness={(freshness) => setAnswers((a) => ({ ...a, freshness }))}
              recommendedDays={recommendedDays}
              intervalDays={intervalDays}
              onIntervalDaysChange={setIntervalDays}
            />
          </View>
        </ScrollView>
      )}

      <View className="border-t border-light-secondary px-global pt-3 dark:border-dark-secondary" style={{ paddingBottom: safeBottomPad }}>
        <AppButton
          size="lg"
          variant="default"
          rounded="full"
          fullWidth
          disabled={(!isCelebrationStep && nextDisabled) || submitting}
          textClassName="text-white"
          title={submitting ? t('visitPlanLoading') : footerLabel}
          onPress={() => void goNext()}
        />
      </View>
    </View>
  );
}

export default function VisitPlanSetupScreen() {
  return (
    <VisitPlanRoot>
      <VisitPlanGate redirectIfHasPlan>
        <SetupBody />
      </VisitPlanGate>
    </VisitPlanRoot>
  );
}
