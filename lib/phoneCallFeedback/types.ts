import type { PhoneCallFeedbackReasonKey } from '@/constants/phoneCallFeedbackReasons';
import type { Locale } from '@/contexts/LanguageContext';

export interface PhoneCallFeedbackPayload {
  rating: number | null;
  reasons: PhoneCallFeedbackReasonKey[];
  source: 'app';
  isLoggedIn: boolean;
  clientName?: string | null;
  phone?: string | null;
  locale?: Locale;
  userAgent?: string;
}
