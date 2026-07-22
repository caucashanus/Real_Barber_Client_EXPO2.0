export function resolveBookingFlowFooterAction(params: {
  isContactStep: boolean;
  isDatetimeStep?: boolean;
  isServiceStep?: boolean;
  skipContact?: boolean;
  skipDatetime?: boolean;
  authPrefillReady?: boolean;
  submitSuccess: boolean;
  selectedSlot: unknown | null;
  selectedService?: unknown | null;
  awaitingPhoneOtp: boolean;
  otpDigits: string;
  submitting: boolean;
  onSubmit: () => void;
  labels: {
    submit: string;
    submitting: string;
    otpConfirm: string;
    otpVerifying: string;
  };
}): {
  title: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  variant: 'primary' | 'outline';
} | null {
  const {
    isContactStep,
    isDatetimeStep = false,
    isServiceStep = false,
    skipContact = false,
    skipDatetime = false,
    authPrefillReady = true,
    submitSuccess,
    selectedSlot,
    selectedService = null,
    awaitingPhoneOtp,
    otpDigits,
    submitting,
    onSubmit,
    labels,
  } = params;

  if (submitSuccess) return null;

  const canDirectSubmit = skipContact && authPrefillReady;
  const canSubmitOnDatetime = canDirectSubmit && isDatetimeStep && Boolean(selectedSlot);
  const canSubmitOnHandoffService =
    canDirectSubmit &&
    skipDatetime &&
    isServiceStep &&
    Boolean(selectedSlot) &&
    Boolean(selectedService);

  if (!isContactStep && !canSubmitOnDatetime && !canSubmitOnHandoffService) {
    return null;
  }

  if (awaitingPhoneOtp) {
    const code = otpDigits.replace(/\D/g, '');
    return {
      title: submitting ? labels.otpVerifying : labels.otpConfirm,
      onPress: onSubmit,
      loading: submitting,
      disabled: submitting || code.length !== 6,
      variant: 'outline',
    };
  }

  if (!selectedSlot) return null;

  return {
    title: submitting ? labels.submitting : labels.submit,
    onPress: onSubmit,
    loading: submitting,
    disabled: submitting,
    variant: 'primary',
  };
}
