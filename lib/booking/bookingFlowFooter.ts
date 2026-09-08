import { isStepSatisfiedForKind } from '@/lib/booking/engine/navigation/cleanup';
import type { BookingSelections, BookingStepKind } from '@/lib/booking/engine/types';

export type BookingFlowFooterVariant = 'continue' | 'submit' | 'outline';

const PICKER_STEPS: BookingStepKind[] = ['branch', 'service', 'employee', 'datetime'];

export function resolveBookingFlowFooterAction(params: {
  step: BookingStepKind;
  submitSuccess: boolean;
  isSlotHandoffFlow?: boolean;
  authPrefillReady?: boolean;
  selections: BookingSelections;
  isCreatingHold?: boolean;
  submitting: boolean;
  onContinue: () => void;
  onSubmit: () => void;
  labels: {
    continue: string;
    submit: string;
    submitting: string;
  };
}): {
  title: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  variant: BookingFlowFooterVariant;
} | null {
  const {
    step,
    submitSuccess,
    isSlotHandoffFlow = false,
    authPrefillReady = true,
    selections,
    submitting,
    onContinue,
    onSubmit,
    labels,
    isCreatingHold = false,
  } = params;

  if (submitSuccess) return null;

  if (PICKER_STEPS.includes(step)) {
    if (step === 'service' && isSlotHandoffFlow) return null;
    if (isStepSatisfiedForKind(step, selections)) {
      return {
        title: labels.continue,
        onPress: onContinue,
        loading: isCreatingHold,
        disabled: isCreatingHold,
        variant: 'continue',
      };
    }
    return null;
  }

  const canSubmit = step === 'summary' && authPrefillReady;
  if (!canSubmit) return null;

  if (!selections.slot?.start) return null;

  return {
    title: submitting ? labels.submitting : labels.submit,
    onPress: onSubmit,
    loading: submitting,
    disabled: submitting,
    variant: 'submit',
  };
}
