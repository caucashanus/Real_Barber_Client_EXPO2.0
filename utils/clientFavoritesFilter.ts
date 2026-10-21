import type { Favorite } from '@/api/favorites';

export type ClientFavoriteFilter = 'all' | 'employee' | 'branch' | 'service' | 'guide';

function normalizeEntityType(fav: Favorite): string {
  return (fav.entityType ?? '').toLowerCase();
}

function isEmployeeFavorite(fav: Favorite): boolean {
  return normalizeEntityType(fav) === 'employee';
}

function isBranchFavorite(fav: Favorite): boolean {
  return normalizeEntityType(fav) === 'branch';
}

function isServiceFavorite(fav: Favorite): boolean {
  const type = normalizeEntityType(fav);
  return type === 'service' || type === 'item';
}

function isGuideFavorite(fav: Favorite): boolean {
  return normalizeEntityType(fav) === 'guide';
}

export function countClientFavoritesByFilter(favorites: Favorite[]): {
  all: number;
  employee: number;
  branch: number;
  service: number;
  guide: number;
} {
  let employee = 0;
  let branch = 0;
  let service = 0;
  let guide = 0;
  for (const fav of favorites) {
    if (isEmployeeFavorite(fav)) employee += 1;
    if (isBranchFavorite(fav)) branch += 1;
    if (isServiceFavorite(fav)) service += 1;
    if (isGuideFavorite(fav)) guide += 1;
  }
  return { all: favorites.length, employee, branch, service, guide };
}

export function filterClientFavorites(
  favorites: Favorite[],
  filter: ClientFavoriteFilter
): Favorite[] {
  if (filter === 'all') return favorites;
  if (filter === 'employee') return favorites.filter(isEmployeeFavorite);
  if (filter === 'branch') return favorites.filter(isBranchFavorite);
  if (filter === 'service') return favorites.filter(isServiceFavorite);
  if (filter === 'guide') return favorites.filter(isGuideFavorite);
  return favorites;
}
