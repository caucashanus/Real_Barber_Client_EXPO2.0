import type { TranslationKey } from '@/locales';

/** Stav připomínek pro řádek / badge (Zapnuto / Vypnuto). */
export function formatVisitPlanRemindersSubtitle(
  remindersEnabled: boolean,
  t: (key: TranslationKey) => string
): string {
  return remindersEnabled ? t('visitPlanRemindersOn') : t('visitPlanRemindersOff');
}
