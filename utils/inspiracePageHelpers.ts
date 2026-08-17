import type { PublicInspiracePageItem } from '@/api/publicInspiracePage';
import type { ServiceGridItem } from '@/components/services/ServiceItemGrid';
import { INSPIRACE_GRID_MAX_LIMIT } from '@/constants/inspiraceGrid';
import type { Locale } from '@/contexts/LanguageContext';
import { hairstyleDetailHref } from '@/constants/profileDetailRoutes';
import { showIsNew } from '@/utils/crmIsNew';

const PLACEHOLDER_IMAGE = require('@/assets/img/barbers.png');

function getLocalizedInspiraceName(item: PublicInspiracePageItem, locale: Locale): string {
  if (locale === 'en' && item.nameEn?.trim()) return item.nameEn.trim();
  return item.name?.trim() || 'Účes';
}

function getLocalizedInspiraceTag(item: PublicInspiracePageItem, locale: Locale): string {
  if (locale === 'en' && item.tagEn?.trim()) return item.tagEn.trim();
  return item.tag?.trim() ?? '';
}

export function sortInspiraceItems(
  items: PublicInspiracePageItem[],
  locale: Locale
): PublicInspiracePageItem[] {
  return [...items].sort((a, b) =>
    getLocalizedInspiraceName(a, locale).localeCompare(getLocalizedInspiraceName(b, locale), locale, {
      sensitivity: 'base',
    })
  );
}

export function mapInspiraceItemToGridItem(
  item: PublicInspiracePageItem,
  locale: Locale
): ServiceGridItem {
  const imageUrl = item.imageUrl?.trim() ?? '';
  const badgeLabel = getLocalizedInspiraceTag(item, locale);

  return {
    id: item.id,
    title: getLocalizedInspiraceName(item, locale),
    image: imageUrl || PLACEHOLDER_IMAGE,
    href: hairstyleDetailHref(item.id),
    entityType: 'service',
    entityId: item.id,
    badgeLabel: badgeLabel || undefined,
    isNew: showIsNew(item),
  };
}

export function sliceInspiraceGridItems(
  items: PublicInspiracePageItem[],
  offset: number,
  limit: number
): PublicInspiracePageItem[] {
  const safeLimit = Math.min(Math.max(limit, 0), INSPIRACE_GRID_MAX_LIMIT);
  return items.slice(offset, offset + safeLimit);
}

export function mapInspiraceItemsToGridItems(
  items: PublicInspiracePageItem[],
  locale: Locale
): ServiceGridItem[] {
  return items.map((item) => mapInspiraceItemToGridItem(item, locale));
}
