import type { Favorite } from '@/api/favorites';
import {
  LEGACY_BARBER_DETAIL_ROUTE,
  LEGACY_BRANCH_DETAIL_ROUTE,
  LEGACY_SERVICE_DETAIL_ROUTE,
} from '@/constants/profileDetailRoutes';

function detailHref(base: string, id: string): string {
  return `${base}?id=${encodeURIComponent(id)}`;
}

/**
 * Oblíbené jsou mimo home stack — používáme `/screens/*` routy (root stack),
 * ne `/branch-detail` v `(home)` tabu.
 *
 * CRM entityType:
 * - `employee` → holič
 * - `branch` → pobočka
 * - `item` → katalog služeb (vlasy, vousy…)
 * - `service` → inspirace / účes (hairstyle detail)
 */
export function favoriteDetailHref(fav: Favorite): string | undefined {
  const type = (fav.entityType ?? '').toLowerCase();
  const id = fav.entityId?.trim();
  if (!id) return undefined;

  switch (type) {
    case 'branch':
      return detailHref(LEGACY_BRANCH_DETAIL_ROUTE, id);
    case 'employee':
      return detailHref(LEGACY_BARBER_DETAIL_ROUTE, id);
    case 'item':
      return detailHref(LEGACY_SERVICE_DETAIL_ROUTE, id);
    case 'service':
      return detailHref('/screens/hairstyle-detail', id);
    case 'product':
      return detailHref('/screens/product-detail', id);
    case 'guide':
      return detailHref('/screens/guide-detail', id);
    default:
      return undefined;
  }
}
