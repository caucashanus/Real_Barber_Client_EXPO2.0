import type { BookingEntity, BookingService } from '@/lib/booking/constants';
import type {
  BookingCatalogItem,
  BookingEmployeePickerEmployee,
  BookingFlatAvailabilityMap,
  BookingFlatSlot,
} from '@/lib/booking/booking-api/types';

export function mapCatalogItemToService(item: BookingCatalogItem): BookingService {
  const fromPrice = item.priceFrom != null && item.priceFrom > 0 ? item.priceFrom : undefined;
  const exactPrice = item.price != null && item.price > 0 ? item.price : undefined;
  const kind = fromPrice != null ? 'from' : exactPrice != null ? 'exact' : undefined;
  const minPrice = fromPrice ?? exactPrice;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    webUrl: item.webUrl ?? undefined,
    category: item.category
      ? {
          id: item.category.id ?? '',
          name: item.category.name,
        }
      : undefined,
    pricing:
      minPrice != null && kind
        ? { minPrice, maxPrice: kind === 'exact' ? minPrice : undefined, kind }
        : undefined,
    duration: item.durationMinutes ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    avatarUrl: item.imageUrl ?? undefined,
  };
}

export function minPricesFromCatalogItems(items: BookingCatalogItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    if (item.priceFrom != null && item.priceFrom > 0) {
      out[item.id] = item.priceFrom;
    }
  }
  return out;
}

export function mapPickerEmployeeToEntity(emp: BookingEmployeePickerEmployee): BookingEntity {
  return {
    id: emp.id,
    slug: emp.slug,
    name: emp.name,
    displayName: emp.displayName ?? emp.name,
    avatarUrl: emp.avatarUrl,
    stats: emp.averageRating != null ? { averageRating: emp.averageRating } : undefined,
  };
}

export function mapCatalogItemsFromEmployee(employee: BookingEntity): BookingCatalogItem[] {
  const raw = (employee.items ?? employee.services ?? []) as BookingCatalogItem[];
  return raw
    .map((entry) => {
      const ref = entry as BookingCatalogItem & {
        itemId?: string | number;
        item?: BookingCatalogItem;
      };
      if (ref.item?.id) {
        return { ...ref.item, id: String(ref.item.id) };
      }
      const id = ref.id ?? ref.itemId;
      if (id == null) return null;
      return { ...ref, id: String(id) };
    })
    .filter((item): item is BookingCatalogItem => Boolean(item?.id));
}

export function mergeFlatAvailability(
  existing: BookingFlatAvailabilityMap | undefined,
  incoming: BookingFlatAvailabilityMap
): BookingFlatAvailabilityMap {
  return { ...existing, ...incoming };
}

export function getDatesWithSlots(map: BookingFlatAvailabilityMap | undefined): string[] {
  if (!map) return [];
  return Object.entries(map)
    .filter(([, day]) => !day.closed && (day.slots?.length ?? 0) > 0)
    .map(([date]) => date)
    .sort();
}

export function getSlotsForDate(
  map: BookingFlatAvailabilityMap | undefined,
  date: string
): BookingFlatSlot[] {
  return map?.[date]?.slots ?? [];
}

export function getMultiBranchSlotsForDate(
  availabilityByBranch: Record<string, { availability?: BookingFlatAvailabilityMap } | null>,
  date: string
): Array<BookingFlatSlot & { branchId: string }> {
  const slots: Array<BookingFlatSlot & { branchId: string }> = [];
  for (const [branchId, data] of Object.entries(availabilityByBranch)) {
    for (const slot of data?.availability?.[date]?.slots ?? []) {
      slots.push({ ...slot, branchId: slot.branchId ?? branchId });
    }
  }
  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

export function getMultiBranchDatesWithSlots(
  availabilityByBranch: Record<string, { availability?: BookingFlatAvailabilityMap } | null>
): string[] {
  const dates = new Set<string>();
  for (const data of Object.values(availabilityByBranch)) {
    for (const date of getDatesWithSlots(data?.availability)) {
      dates.add(date);
    }
  }
  return [...dates].sort();
}

export function getBranchIdsWithSlotsOnDate(
  availabilityByBranch: Record<string, { availability?: BookingFlatAvailabilityMap } | null>,
  date: string
): string[] {
  const ids: string[] = [];
  for (const [branchId, data] of Object.entries(availabilityByBranch)) {
    const slots = data?.availability?.[date]?.slots ?? [];
    if (slots.length > 0) ids.push(branchId);
  }
  return ids;
}
