import { describe, expect, it } from 'vitest';

import { resolveWebPathToAppRoute } from '@/lib/linking/resolveWebPath';

describe('resolveWebPathToAppRoute', () => {
  it('maps inspirace and team list', () => {
    expect(resolveWebPathToAppRoute('/inspirace/')).toBe('/inspirace');
    expect(resolveWebPathToAppRoute('/tym/')).toBe('/experience');
    expect(resolveWebPathToAppRoute('/kontakty/')).toBe('/branches');
  });

  it('maps hairstyle slugs from /sluzby/{slug}/', () => {
    expect(resolveWebPathToAppRoute('/sluzby/afro/')).toBe('/hairstyle-detail?id=afro');
    expect(resolveWebPathToAppRoute('/sluzby/bowl-cut/')).toBe('/hairstyle-detail?id=bowl-cut');
  });

  it('maps services catalog and pricing', () => {
    expect(resolveWebPathToAppRoute('/sluzby')).toBe('/services');
    expect(resolveWebPathToAppRoute('/cenik')).toBe('/services');
  });

  it('maps team member profiles', () => {
    expect(resolveWebPathToAppRoute('/tym/barca/')).toBe('/barber-detail?id=barca');
  });

  it('maps branch web slugs', () => {
    expect(resolveWebPathToAppRoute('/branches/real-barber-modrany/')).toBe(
      '/branch-detail?id=real-barber-modrany'
    );
  });

  it('maps map, login, reservations, profile settings', () => {
    expect(resolveWebPathToAppRoute('/mapa/')).toBe('/screens/map');
    expect(resolveWebPathToAppRoute('/login')).toBe('/screens/login');
    expect(resolveWebPathToAppRoute('/u/rezervace')).toBe('/bookings');
    expect(resolveWebPathToAppRoute('/u/nastaveni/profil')).toBe('/screens/edit-profile');
  });

  it('maps booking entry', () => {
    expect(resolveWebPathToAppRoute('/rezervace')).toBe('/screens/reservation-create');
  });

  it('maps blog to in-app-web', () => {
    expect(resolveWebPathToAppRoute('/blog/rozhovor-s-barcou/')).toMatch(
      /^\/screens\/in-app-web\?url=/
    );
  });

  it('maps promo detail paths', () => {
    expect(resolveWebPathToAppRoute('/promo/poster/abc/')).toBe('/promo/poster/abc');
    expect(resolveWebPathToAppRoute('/promo/kupon/xyz/')).toBe('/promo/kupon/xyz');
  });

  it('returns null for unhandled paths without forcing in-app-web', () => {
    expect(resolveWebPathToAppRoute('/prace/')).toBeNull();
  });
});
