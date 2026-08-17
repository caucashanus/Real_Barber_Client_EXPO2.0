import type {
  PublicHairstyle,
  PublicHairstyleNearestSlot,
  PublicHairstylePreferredEmployee,
  PublicHairstyleSimilar,
} from '@/api/publicHairstylePage';
import type { BranchEmployee } from '@/api/branches';
import type { ServiceGridItem } from '@/components/services/ServiceItemGrid';
import { hairstyleDetailHref } from '@/constants/profileDetailRoutes';
import type { Locale } from '@/contexts/LanguageContext';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';
import { labelHairstyleEnumValues } from '@/utils/hairstyleEnumLabels';
import { showIsNew } from '@/utils/crmIsNew';

export interface HairstyleHeroSlide {
  src: string;
  alt: string;
}

export interface HairstyleServiceDetail {
  id: string;
  slug: string;
  title: string;
  webUrl: string | null;
  aboutBadge: string;
  popularityBadge: string;
  heroSlides: HairstyleHeroSlide[];
  description: string;
  descriptionForWho: string;
  stylingDifficulty: number | null;
  faceShapeLabels: string[];
  hairTypeLabels: string[];
  hairPropertyLabels: string[];
  hairLengthLabels: string[];
  similarHairstyles: ServiceGridItem[];
  galleryImages: { url: string; alt: string }[];
  nearestSlots: NearestBranchHomeSlot[];
  preferredEmployees: BranchEmployee[];
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
  if (locale === 'uk') {
    const uk = raw[`${baseKey}Uk`];
    if (typeof uk === 'string' && uk.trim()) return uk.trim();
  }
  const cs = raw[baseKey];
  if (typeof cs === 'string' && cs.trim()) return cs.trim();
  return '';
}

function slugFromWebUrl(webUrl: string | null | undefined): string {
  if (!webUrl?.trim()) return '';
  const match = webUrl.trim().match(/\/(?:sluzby|services)\/([^/?#]+)/i);
  if (!match?.[1]) return '';
  try {
    return decodeURIComponent(match[1]).toLowerCase();
  } catch {
    return match[1].toLowerCase();
  }
}

function buildHeroSlides(
  hairstyle: PublicHairstyle,
  locale: Locale,
  mainAlt: string
): HairstyleHeroSlide[] {
  const slides: HairstyleHeroSlide[] = [];
  const hero = hairstyle.imageUrl?.trim();
  if (hero) slides.push({ src: hero, alt: mainAlt });

  const sorted = [...(hairstyle.media ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const item of sorted) {
    const url = item.url?.trim();
    if (!url || slides.some((slide) => slide.src === url)) continue;
    slides.push({ src: url, alt: localePickMediaTitle(item, locale) || mainAlt });
  }
  return slides;
}

function localePickMediaTitle(
  media: { title?: string | null; titleEn?: string | null },
  locale: Locale
): string {
  if (locale === 'en' && media.titleEn?.trim()) return media.titleEn.trim();
  return media.title?.trim() ?? '';
}

function mapGalleryImages(
  hairstyle: PublicHairstyle,
  locale: Locale,
  mainAlt: string
): { url: string; alt: string }[] {
  const sorted = [...(hairstyle.media ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const fromMedia = sorted
    .map((item) => ({
      url: item.url?.trim() ?? '',
      alt: localePickMediaTitle(item, locale) || mainAlt,
    }))
    .filter((item) => item.url);

  if (fromMedia.length > 0) return fromMedia;

  const hero = hairstyle.imageUrl?.trim();
  return hero ? [{ url: hero, alt: mainAlt }] : [];
}

function mapSimilarItem(similar: PublicHairstyleSimilar, locale: Locale): ServiceGridItem {
  const title =
    pickLocalized(similar as unknown as Record<string, unknown>, locale, 'name') || similar.name;
  const imageUrl = similar.imageUrl?.trim() ?? '';
  return {
    id: similar.id,
    title,
    image: imageUrl || require('@/assets/img/barbers.png'),
    href: hairstyleDetailHref(similar.id),
    entityType: 'service',
    entityId: similar.id,
    isNew: showIsNew(similar),
  };
}

function mapPreferredEmployee(
  employee: PublicHairstylePreferredEmployee,
  locale: Locale
): BranchEmployee {
  const name =
    pickLocalized(employee as unknown as Record<string, unknown>, locale, 'name') || employee.name;
  return {
    id: employee.id,
    name,
    avatarUrl: employee.avatarUrl,
  };
}

function mapNearestSlot(
  slot: PublicHairstyleNearestSlot,
  locale: Locale
): NearestBranchHomeSlot {
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

export function mapHairstyleToServiceDetail(
  hairstyle: PublicHairstyle,
  locale: Locale
): HairstyleServiceDetail {
  const raw = hairstyle as PublicHairstyle & Record<string, unknown>;
  const title = pickLocalized(raw, locale, 'name') || 'Účes';
  const imageAlt = pickLocalized(raw, locale, 'imageAlt') || title;
  const slug = slugFromWebUrl(hairstyle.webUrl ?? null) || hairstyle.id;

  return {
    id: hairstyle.id,
    slug,
    title,
    webUrl: hairstyle.webUrl?.trim() || null,
    aboutBadge: pickLocalized(raw, locale, 'tag') || hairstyle.tag?.trim() || '',
    popularityBadge:
      hairstyle.popularity != null && hairstyle.popularity >= 1 ? String(hairstyle.popularity) : '',
    heroSlides: buildHeroSlides(hairstyle, locale, imageAlt),
    description: pickLocalized(raw, locale, 'description'),
    descriptionForWho: pickLocalized(raw, locale, 'intendedFor'),
    stylingDifficulty: hairstyle.stylingDifficulty,
    faceShapeLabels: labelHairstyleEnumValues('faceShapes', hairstyle.faceShapes, locale),
    hairTypeLabels: labelHairstyleEnumValues('hairTypes', hairstyle.hairTypes, locale),
    hairPropertyLabels: labelHairstyleEnumValues(
      'hairProperties',
      hairstyle.hairProperties,
      locale
    ),
    hairLengthLabels: labelHairstyleEnumValues('hairLengths', hairstyle.hairLengths, locale),
    similarHairstyles: (hairstyle.similarHairstyles ?? []).map((item) =>
      mapSimilarItem(item, locale)
    ),
    galleryImages: mapGalleryImages(hairstyle, locale, imageAlt),
    nearestSlots: (hairstyle.nearestSlots ?? []).map((slot) => mapNearestSlot(slot, locale)),
    preferredEmployees: (hairstyle.preferredEmployees ?? []).map((item) =>
      mapPreferredEmployee(item, locale)
    ),
    isNew: showIsNew(hairstyle),
  };
}

export function buildHairstyleBookingHref(serviceId: string, serviceName: string): string {
  return `/screens/reservation-create?recipe=service-detail&itemId=${encodeURIComponent(serviceId)}&itemName=${encodeURIComponent(serviceName)}`;
}

export function buildHairstyleReviewParams(
  serviceId: string,
  serviceName: string,
  imageUrl?: string | null
): string {
  return `entityType=service&entityId=${encodeURIComponent(serviceId)}&entityName=${encodeURIComponent(serviceName)}${imageUrl ? `&entityImage=${encodeURIComponent(imageUrl)}` : ''}`;
}
