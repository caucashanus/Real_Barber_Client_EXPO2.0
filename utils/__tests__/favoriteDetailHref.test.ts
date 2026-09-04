import { describe, expect, it } from 'vitest';

import type { Favorite } from '@/api/favorites';
import { favoriteDetailHref } from '@/utils/favoriteDetailHref';

function fav(entityType: string, entityId: string): Favorite {
  return { id: 'f1', entityType, entityId };
}

describe('favoriteDetailHref', () => {
  it('maps branch and employee to /screens detail routes', () => {
    expect(favoriteDetailHref(fav('branch', 'branch-uuid'))).toBe(
      '/screens/branch-detail?id=branch-uuid'
    );
    expect(favoriteDetailHref(fav('employee', 'emp-uuid'))).toBe(
      '/screens/barber-detail?id=emp-uuid'
    );
  });

  it('maps catalog item vs inspirace service to different screens', () => {
    expect(favoriteDetailHref(fav('item', 'svc-uuid'))).toBe(
      '/screens/service-detail?id=svc-uuid'
    );
    expect(favoriteDetailHref(fav('service', 'hair-uuid'))).toBe(
      '/screens/hairstyle-detail?id=hair-uuid'
    );
  });

  it('normalizes entity type casing', () => {
    expect(favoriteDetailHref(fav('Branch', 'b1'))).toBe('/screens/branch-detail?id=b1');
  });

  it('returns undefined when entity id is missing', () => {
    expect(favoriteDetailHref({ id: 'x', entityType: 'branch', entityId: '' })).toBeUndefined();
  });
});
