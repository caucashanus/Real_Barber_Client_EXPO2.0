import type { BookingSelectionsState } from '@/lib/booking/engine/bookingSelectionsReducer';
import type { BookingStepKind } from '@/lib/booking/engine/types';

/** Ze summary/contact zpět na datetime — slot a date zůstávají (revisit). */
export function isRevisitDatetime(
  fromStep: BookingStepKind,
  toStep: BookingStepKind
): boolean {
  return toStep === 'datetime' && (fromStep === 'summary' || fromStep === 'contact');
}

function shouldClearStep(
  kind: BookingStepKind,
  fromIdx: number,
  toIdx: number,
  activeSteps: readonly BookingStepKind[]
): boolean {
  const idx = activeSteps.indexOf(kind);
  return idx !== -1 && fromIdx >= idx && toIdx < idx;
}

export function applyBackwardSelectionCleanup(
  state: BookingSelectionsState,
  fromStep: BookingStepKind,
  toStep: BookingStepKind,
  activeSteps: readonly BookingStepKind[]
): BookingSelectionsState {
  const fromIdx = activeSteps.indexOf(fromStep);
  const toIdx = activeSteps.indexOf(toStep);
  if (fromIdx === -1 || toIdx === -1 || toIdx >= fromIdx) return state;

  const revisitDatetime = isRevisitDatetime(fromStep, toStep);
  let next = state;

  if (
    !revisitDatetime &&
    (shouldClearStep('contact', fromIdx, toIdx, activeSteps) ||
      shouldClearStep('summary', fromIdx, toIdx, activeSteps) ||
      shouldClearStep('datetime', fromIdx, toIdx, activeSteps))
  ) {
    next = { ...next, slot: null };
  }

  if (!revisitDatetime && shouldClearStep('datetime', fromIdx, toIdx, activeSteps)) {
    next = { ...next, date: null };
  }

  if (shouldClearStep('employee', fromIdx, toIdx, activeSteps)) {
    next = { ...next, employee: null };
  }
  if (shouldClearStep('service', fromIdx, toIdx, activeSteps)) {
    next = { ...next, service: null };
  }
  if (shouldClearStep('branch', fromIdx, toIdx, activeSteps)) {
    next = { ...next, branch: null };
  }

  return next;
}
