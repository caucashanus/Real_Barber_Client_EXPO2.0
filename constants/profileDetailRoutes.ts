export const BARBER_DETAIL_ROUTE = '/barber-detail';
export const BRANCH_DETAIL_ROUTE = '/branch-detail';
export const HAIRSTYLE_DETAIL_ROUTE = '/hairstyle-detail';

export const LEGACY_BARBER_DETAIL_ROUTE = '/screens/barber-detail';
export const LEGACY_BRANCH_DETAIL_ROUTE = '/screens/branch-detail';

export function barberDetailHref(id: string): string {
  return `${BARBER_DETAIL_ROUTE}?id=${encodeURIComponent(id)}`;
}

export function branchDetailHref(id: string): string {
  return `${BRANCH_DETAIL_ROUTE}?id=${encodeURIComponent(id)}`;
}

export function hairstyleDetailHref(id: string): string {
  return `${HAIRSTYLE_DETAIL_ROUTE}?id=${encodeURIComponent(id)}`;
}
