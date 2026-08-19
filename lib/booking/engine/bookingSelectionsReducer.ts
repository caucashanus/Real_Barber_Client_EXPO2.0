import type { BookingEntity, BookingService, BookingSlot } from '@/lib/booking/constants';
import { applyBackwardSelectionCleanup } from '@/lib/booking/engine/session/stepPolicy';
import type { BookingStepKind } from '@/lib/booking/engine/types';

export type BookingSelectionsState = {
  branch: BookingEntity | null;
  service: BookingService | null;
  employee: BookingEntity | null;
  date: string | null;
  slot: BookingSlot | null;
};

export const EMPTY_BOOKING_SELECTIONS_STATE: BookingSelectionsState = {
  branch: null,
  service: null,
  employee: null,
  date: null,
  slot: null,
};

export type BookingSelectionsAction =
  | { type: 'SET_BRANCH'; branch: BookingEntity | null; clearDownstream?: boolean }
  | { type: 'SET_SERVICE'; service: BookingService | null; clearDownstream?: boolean }
  | { type: 'SET_EMPLOYEE'; employee: BookingEntity | null; clearDownstream?: boolean }
  | { type: 'SET_DATE'; date: string | null; clearSlot?: boolean }
  | { type: 'SET_SLOT'; slot: BookingSlot | null }
  | {
      type: 'PATCH';
      patch: (state: BookingSelectionsState) => Partial<BookingSelectionsState>;
    }
  | {
      type: 'BACKWARD_CLEANUP';
      fromStep: BookingStepKind;
      toStep: BookingStepKind;
      activeSteps: readonly BookingStepKind[];
    }
  | { type: 'RESTORE'; payload: Partial<BookingSelectionsState> }
  | { type: 'RESET' };

export function bookingSelectionsReducer(
  state: BookingSelectionsState,
  action: BookingSelectionsAction
): BookingSelectionsState {
  switch (action.type) {
    case 'SET_BRANCH': {
      if (action.clearDownstream === false) {
        return { ...state, branch: action.branch };
      }
      return {
        ...state,
        branch: action.branch,
        service: null,
        employee: null,
        date: null,
        slot: null,
      };
    }
    case 'SET_SERVICE': {
      if (action.clearDownstream === false) {
        return { ...state, service: action.service };
      }
      return {
        ...state,
        service: action.service,
        employee: null,
        date: null,
        slot: null,
      };
    }
    case 'SET_EMPLOYEE': {
      if (action.clearDownstream === false) {
        return { ...state, employee: action.employee };
      }
      return {
        ...state,
        employee: action.employee,
        date: null,
        slot: null,
      };
    }
    case 'SET_DATE':
      return {
        ...state,
        date: action.date,
        slot: action.clearSlot === false ? state.slot : null,
      };
    case 'SET_SLOT':
      return { ...state, slot: action.slot };
    case 'PATCH':
      return { ...state, ...action.patch(state) };
    case 'BACKWARD_CLEANUP':
      return applyBackwardSelectionCleanup(
        state,
        action.fromStep,
        action.toStep,
        action.activeSteps
      );
    case 'RESTORE':
      return { ...state, ...action.payload };
    case 'RESET':
      return EMPTY_BOOKING_SELECTIONS_STATE;
    default:
      return state;
  }
}
