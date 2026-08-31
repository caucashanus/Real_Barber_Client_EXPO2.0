import { CRM_BASE } from '@/api/http';

import {
  branchGoogleMapsUrl,
  branchStreetAddress,
  branchWazeUrl,
  getBranchContact,
} from '@/lib/rbicek/port/data/branchContacts';
import { localizedWebUrl } from '@/lib/rbicek/localizedWebUrl';
import type {
  BranchCardData,
  PromoCardData,
  RbicekLocale,
  SlotCardData,
  TeamMemberCardData,
} from '@/lib/rbicek/types';
import { formatSlotDate, pragueTodayIso } from '@/lib/rbicek/utils';

interface AvailabilityEmployee {
  id: string;
  name: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
  branches?: { id: string; name: string; address?: string }[];
  service?: { name?: string; price?: number };
  workIntervals?: { branchId: string; startTime: string; endTime: string }[];
  hasShiftOnSearchDate?: boolean;
  fullyBooked?: boolean;
  nextSlot?: { date: string; time: string; endTime?: string; duration?: number; branchId?: string };
  nextSlots?: { date: string; time: string; branchId?: string }[];
}

interface PublicBranch {
  id: string;
  name: string;
  nameEn?: string;
  address?: string;
  imageUrl?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
}

const BRANCH_DISTRICTS: Record<string, string> = {
  modrany: 'Praha 12',
  modřany: 'Praha 12',
  barrandov: 'Praha 5',
  kacerov: 'Praha 4',
  kačerov: 'Praha 4',
  hagibor: 'Praha 10',
};

function branchNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function branchDistrict(name: string): string {
  return BRANCH_DISTRICTS[branchNameKey(name)] ?? 'Praha';
}

function formatBranchDisplayAddress(
  branchName: string,
  rawAddress?: string | null,
  district?: string
): string | undefined {
  const contact = getBranchContact(branchName);
  if (contact?.address) return contact.address;

  const cleaned = rawAddress
    ?.replace(/\b\d{3}\s?\d{2}\b/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned) return district;

  if (/,\s*Praha\s+\d+/i.test(cleaned)) {
    return cleaned.replace(/,\s*Praha/i, ', Praha');
  }

  const street = branchStreetAddress(cleaned);
  if (street && district) return `${street}, ${district}`;
  return street || district;
}

function resolveMediaUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${CRM_BASE}${trimmed}`;
  return trimmed;
}

function employeeAvatarUrl(employee: AvailabilityEmployee): string | undefined {
  return resolveMediaUrl(employee.avatarUrl) ?? resolveMediaUrl(employee.imageUrl);
}

function todaySlotFromResult(
  result: AvailabilityEmployee,
  date: string
): AvailabilityEmployee['nextSlot'] | null {
  if (result.nextSlot?.date === date) return result.nextSlot;
  return result.nextSlots?.find((slot) => slot.date === date) ?? null;
}

function localizedBranchName(branch: PublicBranch, locale: RbicekLocale): string {
  if (locale === 'en' && branch.nameEn?.trim()) return branch.nameEn.trim();
  return branch.name.trim();
}

export function mapSlotCards(
  results: AvailabilityEmployee[],
  locale: RbicekLocale,
  webBaseUrl: string,
  limit = 4
): SlotCardData[] {
  return results
    .filter((r) => r.nextSlot)
    .slice(0, limit)
    .map((r) => {
      const slot = r.nextSlot!;
      const branch =
        r.branches?.find((b) => b.id === slot.branchId) ?? r.branches?.[0];
      const profileUrl = localizedWebUrl(r, locale, webBaseUrl);
      return {
        id: r.id,
        employeeId: r.id,
        name: r.name,
        avatarUrl: employeeAvatarUrl(r),
        branchId: branch?.id ?? slot.branchId,
        branchName: branch?.name ?? 'Real Barber',
        branchAddress: branch?.address,
        date: formatSlotDate(slot.date, locale),
        dateRaw: slot.date,
        time: slot.time,
        endTime: slot.endTime,
        duration: slot.duration,
        serviceName: r.service?.name,
        servicePrice: r.service?.price,
        profileUrl: profileUrl || undefined,
        bookingUrl: profileUrl || webBaseUrl,
      };
    });
}

export function mapTeamCards(
  results: AvailabilityEmployee[],
  locale: RbicekLocale,
  webBaseUrl: string
): TeamMemberCardData[] {
  const today = pragueTodayIso();
  return results
    .filter((r) => r.hasShiftOnSearchDate && (r.workIntervals?.length ?? 0) > 0)
    .map((r) => {
      const interval = r.workIntervals![0];
      const branch =
        r.branches?.find((b) => b.id === interval.branchId) ?? r.branches?.[0];
      const todaySlot = todaySlotFromResult(r, today);
      const nextSlot = r.nextSlot ?? todaySlot;
      const fullyBookedToday = todaySlot == null;
      const profileUrl = localizedWebUrl(r, locale, webBaseUrl);
      return {
        id: r.id,
        employeeId: r.id,
        name: r.name,
        avatarUrl: employeeAvatarUrl(r),
        branchId: branch?.id,
        branchName: branch?.name ?? 'Real Barber',
        hours: `${interval.startTime}-${interval.endTime}`,
        profileUrl,
        fullyBookedToday,
        nextSlotDateRaw: nextSlot?.date,
        nextSlotTime: nextSlot?.time,
        bookingUrl: nextSlot ? profileUrl : undefined,
      };
    })
    .sort((a, b) => {
      const rankA = a.fullyBookedToday ? 1 : 0;
      const rankB = b.fullyBookedToday ? 1 : 0;
      if (rankA !== rankB) return rankA - rankB;
      if (a.nextSlotDateRaw && b.nextSlotDateRaw) {
        const byDate = a.nextSlotDateRaw.localeCompare(b.nextSlotDateRaw);
        if (byDate !== 0) return byDate;
      }
      if (a.nextSlotTime && b.nextSlotTime) {
        return a.nextSlotTime.localeCompare(b.nextSlotTime);
      }
      if (a.nextSlotTime) return -1;
      if (b.nextSlotTime) return 1;
      return a.name.localeCompare(b.name, locale === 'en' ? 'en' : 'cs');
    });
}

export function mapBranchCards(
  branches: PublicBranch[],
  locale: RbicekLocale,
  webBaseUrl: string
): BranchCardData[] {
  return branches.map((branch) => {
    const name = localizedBranchName(branch, locale);
    const detailUrl =
      localizedWebUrl(branch, locale) || `${webBaseUrl.replace(/\/$/, '')}/kontakty/`;
    const contact = getBranchContact(name);
    const district = branchDistrict(name);
    const rawAddress = branch.address?.trim() || contact?.address;
    const displayAddress = formatBranchDisplayAddress(name, rawAddress, district);
    return {
      id: branch.id,
      name,
      district,
      imageUrl: resolveMediaUrl(branch.imageUrl),
      detailUrl,
      address: displayAddress,
      note: contact?.note,
      googleMapsUrl: branchGoogleMapsUrl(name, rawAddress),
      wazeUrl: branchWazeUrl(name, rawAddress),
    };
  });
}

export function mapPromoCards(
  posters: Record<string, unknown>[],
  coupons: Record<string, unknown>[],
  locale: RbicekLocale,
  webBaseUrl: string
): PromoCardData[] {
  const showCoupon = locale === 'en' ? 'Show coupon' : locale === 'uk' ? 'Показати купон' : 'Zobrazit kupón';
  const showOffer = locale === 'en' ? 'Show offer' : locale === 'uk' ? 'Показати акцію' : 'Zobrazit akci';

  const posterCards: PromoCardData[] = posters.slice(0, 6).map((p, i) => ({
    id: String(p.id ?? `poster_${i}`),
    key: String(p.key ?? p.id ?? `poster_${i}`),
    title: String(p.title ?? p.name ?? 'Promo'),
    subtitle: typeof p.subtitle === 'string' ? p.subtitle : undefined,
    imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : '',
    imageAlt: typeof p.imageAlt === 'string' ? p.imageAlt : String(p.title ?? 'Promo'),
    actionLabel: typeof p.buttonText === 'string' ? p.buttonText : showOffer,
    detailUrl:
      typeof p.url === 'string'
        ? p.url
        : typeof p.detailUrl === 'string'
          ? p.detailUrl
          : webBaseUrl,
  }));

  const couponCards: PromoCardData[] = coupons.slice(0, 6).map((c, i) => ({
    id: String(c.id ?? `coupon_${i}`),
    key: String(c.key ?? c.id ?? `coupon_${i}`),
    title: String(c.title ?? c.name ?? 'Kupón'),
    subtitle: typeof c.description === 'string' ? c.description : undefined,
    imageUrl: typeof c.imageUrl === 'string' ? c.imageUrl : '',
    imageAlt: String(c.title ?? c.name ?? 'Kupón'),
    actionLabel: typeof c.buttonText === 'string' ? c.buttonText : showCoupon,
    detailUrl:
      typeof c.url === 'string'
        ? c.url
        : typeof c.detailUrl === 'string'
          ? c.detailUrl
          : webBaseUrl,
    couponCode: typeof c.code === 'string' ? c.code : undefined,
  }));

  return [...posterCards, ...couponCards].slice(0, 8);
}

export const STATIC_BRANCHES: BranchCardData[] = [
  {
    id: 'modrany',
    name: 'Modřany',
    district: 'Praha 12',
    detailUrl: 'https://realbarber.cz/branches/real-barber-modrany/',
    address: 'Čs. exilu 40, Praha 12',
    note: getBranchContact('Modřany')?.note,
    googleMapsUrl: branchGoogleMapsUrl('Modřany', getBranchContact('Modřany')?.address),
    wazeUrl: branchWazeUrl('Modřany', getBranchContact('Modřany')?.address),
  },
  {
    id: 'barrandov',
    name: 'Barrandov',
    district: 'Praha 5',
    detailUrl: 'https://realbarber.cz/branches/barbershop-v-praze-real-barber-barrandov-mens-grooming/',
    address: 'nám. O. Scheinpflugové 4, Praha 5',
    note: getBranchContact('Barrandov')?.note,
    googleMapsUrl: branchGoogleMapsUrl('Barrandov', getBranchContact('Barrandov')?.address),
    wazeUrl: branchWazeUrl('Barrandov', getBranchContact('Barrandov')?.address),
  },
  {
    id: 'kacerov',
    name: 'Kačerov',
    district: 'Praha 4',
    detailUrl: 'https://realbarber.cz/branches/real-barber-kacerov-praha-4/',
    address: 'Budějovická 615/47, Praha 4',
    note: getBranchContact('Kačerov')?.note,
    googleMapsUrl: branchGoogleMapsUrl('Kačerov', getBranchContact('Kačerov')?.address),
    wazeUrl: branchWazeUrl('Kačerov', getBranchContact('Kačerov')?.address),
  },
  {
    id: 'hagibor',
    name: 'Hagibor',
    district: 'Praha 10',
    detailUrl: 'https://realbarber.cz/branches/real-barber-hagibor-strasnice/',
    address: 'Počernická 3492/1a, Praha 10',
    note: getBranchContact('Hagibor')?.note,
    googleMapsUrl: branchGoogleMapsUrl('Hagibor', getBranchContact('Hagibor')?.address),
    wazeUrl: branchWazeUrl('Hagibor', getBranchContact('Hagibor')?.address),
  },
];

export type { AvailabilityEmployee, PublicBranch };
