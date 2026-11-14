import { useEffect } from 'react';

import type { BookingHoldController } from '@/hooks/useBookingHold';
import type { BookingStepKind } from '@/lib/booking/engine/types';

type SubmitSlice = {
  clearSubmitError: () => void;
  submitSuccess: boolean;
};

/** Hold + summary refresh efekty oddělené od orchestrátoru flow. */
export function useBookingEngineHoldStepEffects(options: {
  step: BookingStepKind;
  hold: BookingHoldController;
  submit: SubmitSlice;
  refreshClientFromMe: () => Promise<unknown>;
}) {
  const { step, hold, submit, refreshClientFromMe } = options;

  useEffect(() => {
    if (step !== 'summary' || submit.submitSuccess) return;
    void hold.extendOnce();
  }, [step, submit.submitSuccess, hold]);

  useEffect(() => {
    if (step !== 'summary') return;
    void refreshClientFromMe();
  }, [step, refreshClientFromMe]);

  useEffect(() => {
    if (step !== 'datetime') return;
    submit.clearSubmitError();
    hold.resetExtendOnce();
    if (hold.holdId) {
      void hold.releaseHoldBestEffort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- release once when entering datetime
  }, [step]);
}