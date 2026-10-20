import type { TranslationKey } from '@/locales';
import type { IconName } from '@/components/Icon';

export type HomeFastBookWhenChoice = 'now' | 'later';

export type HomeFastBookWhenOption = {
  id: HomeFastBookWhenChoice;
  icon: IconName;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
};

/** Parita web `homeFastBookWhenOptions.ts`. */
export const HOME_FAST_BOOK_WHEN_OPTIONS: readonly HomeFastBookWhenOption[] = [
  {
    id: 'now',
    icon: 'Clock',
    titleKey: 'fastBookWhenNow',
    subtitleKey: 'fastBookWhenNowSubtitle',
  },
  {
    id: 'later',
    icon: 'Calendar',
    titleKey: 'fastBookWhenLater',
    subtitleKey: 'fastBookWhenLaterSubtitle',
  },
] as const;
