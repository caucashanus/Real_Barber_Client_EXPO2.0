import type {
  PublicCatalogService,
  PublicServiceNearestSlot,
} from '@/api/publicServicePage';
import type { Locale } from '@/contexts/LanguageContext';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';
import { showIsNew } from '@/utils/crmIsNew';

export interface CatalogServiceHeroSlide {
  src: string;
  alt: string;
}

export interface CatalogServiceDetail {
  id: string;
  title: string;
  description: string;
  webUrl: string | null;
  heroSlides: CatalogServiceHeroSlide[];
  nearestSlots: NearestBranchHomeSlot[];
  isNew?: boolean;
}

function pickLocalized(
  raw: Record<string, unknown>,
  locale: Locale,
  baseKey: string
): string {
  if (locale === 'en') {
    const en = raw[`${baseKey}En`];
    if (typeof en === 'string' && en.trim()) return en.trim();
  }
  const cs = raw[baseKey];
  if (typeof cs === 'string' && cs.trim()) return cs.trim();
  return '';
}

function buildHeroSlides(service: PublicCatalogService, locale: Locale, mainAlt: string) {
  const slides: CatalogServiceHeroSlide[] = [];
  const hero = service.imageUrl?.trim();
  if (hero) slides.push({ src: hero, alt: mainAlt });

  const sorted = [...(service.media ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const item of sorted) {
    const url = item.url?.trim();
    if (!url || slides.some((slide) => slide.src === url)) continue;
    slides.push({ src: url, alt: mainAlt });
  }
  return slides;
}

function mapNearestSlot(slot: PublicServiceNearestSlot, locale: Locale): NearestBranchHomeSlot {
  const employeeName =
    pickLocalized(slot.employee as unknown as Record<string, unknown>, locale, 'name') ||
    slot.employee.name;
  const branchName =
    pickLocalized(slot.branch as unknown as Record<string, unknown>, locale, 'name') ||
    slot.branch.name;

  return {
    employeeId: slot.employee.id,
    employeeName,
    date: slot.date,
    time: slot.time,
    endTime: slot.endTime,
    duration: slot.duration,
    branchId: slot.branch.id,
    branchName,
    branchAddress: null,
  };
}

export function mapPublicServiceToDetail(
  service: PublicCatalogService,
  locale: Locale
): CatalogServiceDetail {
  const raw = service as PublicCatalogService & Record<string, unknown>;
  const title = pickLocalized(raw, locale, 'name') || service.name;

  return {
    id: service.id,
    title,
    description: pickLocalized(raw, locale, 'description'),
    webUrl: service.webUrl?.trim() || null,
    heroSlides: buildHeroSlides(service, locale, title),
    nearestSlots: (service.nearestSlots ?? []).map((slot) => mapNearestSlot(slot, locale)),
    isNew: showIsNew(service),
  };
}

export function buildServiceBookingHref(itemId: string, itemName: string): string {
  return `/screens/reservation-create?recipe=service-detail&itemId=${encodeURIComponent(itemId)}&itemName=${encodeURIComponent(itemName)}`;
}
