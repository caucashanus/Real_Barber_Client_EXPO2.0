import { INSPIRACE_HAIRCUTS } from '@/lib/rbicek/port/data/inspiraceHaircuts';
import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { hairstyleDetailHref } from '@/constants/profileDetailRoutes';
import type { HomeSectionChipItem } from '@/utils/homeScheduleDayChips';

/** Stejný pořadí jako web homepage — slug v katalogu může mít jiný tvar. */
const HOME_POPULAR_HAIRCUT_CATALOG_SLUGS = [
  'low-taper-fade',
  'high-fade',
  'middle-fade',
  'drop-fade',
  'taper-fade',
  'low-fade',
  'mullet',
  'french-crop',
  'pompadour',
  'quiff',
  'undercut-fade',
  'old-money-haircut',
  'fluffy-uces',
  'ivy-league-cut',
] as const;

const haircutBySlug = new Map(INSPIRACE_HAIRCUTS.map((item) => [item.slug, item]));

export function buildHomePopularHaircutChips(
  locale: Locale,
  t: (key: TranslationKey) => string
): HomeSectionChipItem[] {
  const chips: HomeSectionChipItem[] = [];

  for (const slug of HOME_POPULAR_HAIRCUT_CATALOG_SLUGS) {
    const haircut = haircutBySlug.get(slug);
    if (!haircut) continue;
    chips.push({
      id: slug,
      label: haircut.name,
      href: hairstyleDetailHref(haircut.id),
    });
  }

  chips.push({
    id: 'see-more',
    label: t('homeHaircutCatalogSeeMore'),
    href: '/inspirace',
  });

  return chips;
}
