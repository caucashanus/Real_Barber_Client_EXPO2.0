import type { TranslationKey } from '@/locales';

export const PHONE_CALL_FEEDBACK_REASON_KEYS = [
  'unpleasant',
  'inflexible',
  'longWait',
  'unreachable',
  'lineBusy',
  'callRejected',
  'wrongInfo',
  'noBookingHelp',
  'rushed',
  'language',
  'other',
] as const;

export type PhoneCallFeedbackReasonKey = (typeof PHONE_CALL_FEEDBACK_REASON_KEYS)[number];

export const PHONE_CALL_FEEDBACK_REASON_LABEL_KEYS: Record<
  PhoneCallFeedbackReasonKey,
  TranslationKey
> = {
  unpleasant: 'phoneCallFeedbackReason_unpleasant',
  inflexible: 'phoneCallFeedbackReason_inflexible',
  longWait: 'phoneCallFeedbackReason_longWait',
  unreachable: 'phoneCallFeedbackReason_unreachable',
  lineBusy: 'phoneCallFeedbackReason_lineBusy',
  callRejected: 'phoneCallFeedbackReason_callRejected',
  wrongInfo: 'phoneCallFeedbackReason_wrongInfo',
  noBookingHelp: 'phoneCallFeedbackReason_noBookingHelp',
  rushed: 'phoneCallFeedbackReason_rushed',
  language: 'phoneCallFeedbackReason_language',
  other: 'phoneCallFeedbackReason_other',
};
