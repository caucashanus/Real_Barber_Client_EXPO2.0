import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { formatRelativeDayLabel } from '@/utils/formatRelativeDayLabel';
import { addCalendarDays, getPragueTodayDateString } from '@/utils/pragueDateHelpers';

export interface HomeSectionChipItem {
  id: string;
  label: string;
  href: string;
}

const FUTURE_DAY_COUNT = 6;

function scheduleHref(date?: string): string {
  if (!date) return '/screens/schedule';
  return `/screens/schedule?date=${encodeURIComponent(date)}`;
}

export function buildHomeScheduleDayChips(
  locale: Locale,
  t: (key: TranslationKey) => string
): HomeSectionChipItem[] {
  const todayIso = getPragueTodayDateString();
  const dayChips: HomeSectionChipItem[] = [];

  for (let offset = 1; offset <= FUTURE_DAY_COUNT; offset += 1) {
    const date = addCalendarDays(todayIso, offset);
    dayChips.push({
      id: `day-${date}`,
      label: formatRelativeDayLabel({
        dayIso: date,
        todayIso,
        locale,
        variant: 'titleTab',
      }),
      href: scheduleHref(date),
    });
  }

  dayChips.push({
    id: 'schedule-all',
    label: t('homeScheduleMoreDays'),
    href: scheduleHref(),
  });

  dayChips.push({
    id: 'full-team',
    label: t('homeTodayTeamOpenFullTeam'),
    href: '/experience',
  });

  return dayChips;
}
