import type { PublicService } from '@/api/publicServicesPage';
import type { ServiceGridItem } from '@/components/services/ServiceItemGrid';
import {
  EXTRA_SERVICES_STATIC,
  type ExtraServiceStaticItem,
} from '@/constants/servicesPageExtra';
import {
  getHomeCuratedHaircutsCarousel,
  type HaircutCarouselItem,
} from '@/constants/homeCuratedHaircutsCarousel';
import type { Locale } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';

const PLACEHOLDER_IMAGE = require('@/assets/img/barbers.png');

const MAIN_SERVICE_SLUG_ORDER = [
  'vlasy-vousy',
  'kompletni-pece-real-barber',
  'barber-klasicke-moderni-strihani-vlasu',
  'uprava-vousu',
  'detske-strihani-do-12-let',
  'rychle-strihani',
] as const;

function pickString(raw: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function slugFromServiceWebUrl(webUrl: string | null | undefined): string | null {
  if (!webUrl?.trim()) return null;
  const match = webUrl.trim().match(/\/(?:sluzby|services)\/([^/?#]+)/i);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).toLowerCase();
  } catch {
    return match[1].toLowerCase();
  }
}

export function pickPublicServiceImageUrl(service: PublicService): string {
  if (service.imageUrl?.trim()) return service.imageUrl.trim();
  const sorted = [...(service.media ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const first = sorted.find((item) => item.url?.trim());
  return first?.url?.trim() ?? '';
}

function getLocalizedServiceName(service: PublicService, locale: Locale): string {
  if (locale === 'en' && service.nameEn?.trim()) return service.nameEn.trim();
  return service.name?.trim() || 'Služba';
}

export function formatServicePriceAmount(value: number): string {
  return `${new Intl.NumberFormat('cs-CZ').format(value)} Kč`;
}

function mainServiceSortIndex(service: PublicService): number {
  const slug = slugFromServiceWebUrl(service.webUrl);
  if (!slug) return MAIN_SERVICE_SLUG_ORDER.length;
  const index = (MAIN_SERVICE_SLUG_ORDER as readonly string[]).indexOf(slug);
  return index >= 0 ? index : MAIN_SERVICE_SLUG_ORDER.length;
}

export function sortMainServices(services: PublicService[]): PublicService[] {
  return [...services].sort((a, b) => mainServiceSortIndex(a) - mainServiceSortIndex(b));
}

export function mapPublicServiceToGridItem(
  service: PublicService,
  locale: Locale
): ServiceGridItem {
  const raw = service as PublicService & Record<string, unknown>;
  const badgeLabel = pickString(raw, ['aboutcz', 'aboutCz', 'about_cz', 'aboutLabel', 'badge']);
  const minPrice = service.pricing?.minPrice ?? 0;
  const imageUrl = pickPublicServiceImageUrl(service);

  return {
    id: service.id,
    title: getLocalizedServiceName(service, locale),
    image: imageUrl || PLACEHOLDER_IMAGE,
    href: `/screens/service-detail?id=${encodeURIComponent(service.id)}`,
    entityType: 'item',
    entityId: service.id,
    priceAmount: minPrice > 0 ? formatServicePriceAmount(minPrice) : undefined,
    badgeLabel: badgeLabel || undefined,
  };
}

function localizedExtraWebUrl(item: ExtraServiceStaticItem, locale: Locale): string {
  if (locale === 'en' && item.webUrlEn?.trim()) return item.webUrlEn.trim();
  return item.webUrlCs;
}

function extraServiceGridItem(
  item: ExtraServiceStaticItem,
  t: (key: TranslationKey) => string,
  locale: Locale
): ServiceGridItem {
  return {
    id: item.id,
    title: t(item.titleKey),
    badgeLabel: t(item.badgeKey),
    priceAmount: item.priceFrom > 0 ? formatServicePriceAmount(item.priceFrom) : undefined,
    image: item.imageSrc,
    href: `/screens/in-app-web?url=${encodeURIComponent(localizedExtraWebUrl(item, locale))}`,
  };
}

export function getExtraServiceGridItems(
  t: (key: TranslationKey) => string,
  locale: Locale
): ServiceGridItem[] {
  return EXTRA_SERVICES_STATIC.map((item) => extraServiceGridItem(item, t, locale));
}

export function getSupplementaryServiceGridItems(
  barveniServices: PublicService[],
  t: (key: TranslationKey) => string,
  locale: Locale
): ServiceGridItem[] {
  return [
    ...barveniServices.map((service) => mapPublicServiceToGridItem(service, locale)),
    ...getExtraServiceGridItems(t, locale),
  ];
}

export function getHaircutCarouselItems(locale: Locale): HaircutCarouselItem[] {
  return getHomeCuratedHaircutsCarousel(locale);
}
