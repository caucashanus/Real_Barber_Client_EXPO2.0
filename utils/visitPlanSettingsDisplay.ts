import type { TranslationKey } from '@/locales';
import type { VisitPlanContactRemind } from '@/utils/visitPlanTypes';

/** Popisek řádku Způsob kontaktu v nastavení (parita web visitPlanContactRemindLabelKeys). */
export function formatVisitPlanContactRemindSubtitle(
  remind: VisitPlanContactRemind,
  t: (key: TranslationKey) => string
): string {
  if (remind.sms && remind.phone) {
    return t('visitPlanContactRemindBoth');
  }
  if (remind.phone) {
    return t('homeTodayTeamWaitlistPreferredPhone');
  }
  return t('homeTodayTeamWaitlistPreferredSms');
}
