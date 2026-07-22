import type { BookingService } from '@/lib/booking/constants';
import type { ServicesByCategory } from '@/lib/booking/bookingWizardTypes';
import {
  BALICKY_CATEGORY_ID,
  BARVENI_CATEGORY_ID,
  HAIRSTYLE_CATEGORY_ID,
  SERVICES_CATEGORY_ID,
  SLUZBY_DOMU_CATEGORY_ID,
} from '@/lib/booking/categoryIds';

export {
  isBookingServiceAccordionCategory,
} from '@/lib/booking/categoryIds';

const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';

const CATEGORY_NAME_TO_ID: Record<string, string> = {
  sluzby: SERVICES_CATEGORY_ID,
  ucesy: HAIRSTYLE_CATEGORY_ID,
  balicky: BALICKY_CATEGORY_ID,
  barveni: BARVENI_CATEGORY_ID,
  'sluzby domu': SLUZBY_DOMU_CATEGORY_ID,
};

const D4_CATEGORY_DEFS = [
  { id: SERVICES_CATEGORY_ID, collapsible: false },
  { id: BALICKY_CATEGORY_ID, collapsible: true },
  { id: SLUZBY_DOMU_CATEGORY_ID, collapsible: false },
  { id: HAIRSTYLE_CATEGORY_ID, collapsible: true },
  { id: BARVENI_CATEGORY_ID, collapsible: false },
] as const;

const CATEGORY_ORDER: Map<string, number> = new Map(
  D4_CATEGORY_DEFS.map((def, index) => [def.id, index])
);

function normCategoryLabel(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ');
}

function resolveCategoryId(service: BookingService): string {
  const category = service.category;
  if (category?.id?.trim()) return category.id.trim();

  const name = category?.name?.trim();
  if (name) {
    const fromName = CATEGORY_NAME_TO_ID[normCategoryLabel(name)];
    if (fromName) return fromName;
    return `name:${normCategoryLabel(name).replace(/\s+/g, '-')}`;
  }

  return UNCATEGORIZED_CATEGORY_ID;
}

function resolveCategoryName(service: BookingService): string {
  return service.category?.name?.trim() || 'Služby';
}

function categorySortIndex(categoryId: string): number {
  const known = CATEGORY_ORDER.get(categoryId);
  if (known != null) return known;
  if (categoryId.startsWith('name:')) return D4_CATEGORY_DEFS.length + 1;
  return D4_CATEGORY_DEFS.length + 2;
}

export function groupServicesByCategory(services: BookingService[]): ServicesByCategory[] {
  if (services.length === 0) return [];

  const buckets = new Map<string, { categoryName: string; services: BookingService[] }>();

  for (const service of services) {
    const categoryId = resolveCategoryId(service);
    const existing = buckets.get(categoryId);
    if (existing) {
      existing.services.push(service);
      continue;
    }
    buckets.set(categoryId, {
      categoryName: resolveCategoryName(service),
      services: [service],
    });
  }

  return [...buckets.entries()]
    .sort(([idA, a], [idB, b]) => {
      const orderDiff = categorySortIndex(idA) - categorySortIndex(idB);
      if (orderDiff !== 0) return orderDiff;
      return a.categoryName.localeCompare(b.categoryName, 'cs');
    })
    .map(([categoryId, entry]) => {
      const def = D4_CATEGORY_DEFS.find((item) => item.id === categoryId);
      return {
        categoryId,
        categoryName: entry.categoryName,
        services: entry.services,
        collapsible: def?.collapsible,
      };
    });
}
