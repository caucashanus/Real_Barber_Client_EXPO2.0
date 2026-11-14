import type { BookingHoldDialogKind } from '@/lib/booking/hold/types';

/** Akce po expiraci holdu / 409 — sdílené mezi dialogem a submit callbackem. */
export type HoldIssueRecoveryActions = {
  releaseHoldBestEffort: () => Promise<void>;
  clearSubmitError: () => void;
  showUnavailableDialog: () => void;
  dismissDialog: () => void;
  goToDatetimeAfterHoldIssue: () => void;
};

export function onReservationSlotConflict(
  actions: Pick<HoldIssueRecoveryActions, 'releaseHoldBestEffort' | 'clearSubmitError' | 'showUnavailableDialog'>
): void {
  void actions.releaseHoldBestEffort();
  actions.clearSubmitError();
  actions.showUnavailableDialog();
}

export function confirmHoldIssueDialog(
  kind: BookingHoldDialogKind | null,
  actions: HoldIssueRecoveryActions
): void {
  actions.dismissDialog();
  actions.clearSubmitError();
  if (kind === 'expired' || kind === 'unavailable') {
    void actions.releaseHoldBestEffort();
    actions.goToDatetimeAfterHoldIssue();
  }
}