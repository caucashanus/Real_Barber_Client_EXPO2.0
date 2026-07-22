import type { Favorite } from '@/api/favorites';

export type ClientFavoriteFilter = 'all' | 'employee' | 'branch';

function isEmployeeFavorite(fav: Favorite): boolean {
  return (fav.entityType ?? '').toLowerCase() === 'employee';
}

function isBranchFavorite(fav: Favorite): boolean {
  return (fav.entityType ?? '').toLowerCase() === 'branch';
}

export function countClientFavoritesByFilter(favorites: Favorite[]): {
  all: number;
  employee: number;
  branch: number;
} {
  let employee = 0;
  let branch = 0;
  for (const fav of favorites) {
    if (isEmployeeFavorite(fav)) employee += 1;
    if (isBranchFavorite(fav)) branch += 1;
  }
  return { all: favorites.length, employee, branch };
}

export function filterClientFavorites(
  favorites: Favorite[],
  filter: ClientFavoriteFilter
): Favorite[] {
  if (filter === 'all') return favorites;
  if (filter === 'employee') return favorites.filter(isEmployeeFavorite);
  return favorites.filter(isBranchFavorite);
}
