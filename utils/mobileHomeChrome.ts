import type { ImageSourcePropType } from 'react-native';

import type { TranslationKey } from '@/locales';

export type MobileHomeTabId =
  | 'realBarber'
  | 'wallet'
  | 'myStyle'
  | 'branches'
  | 'barbers'
  | 'favorites'
  | 'reservations'
  | 'services'
  | 'map'
  | 'schedule'
  | 'inspirace'
  | 'guides';

export type MobileHomeTabDef = {
  id: MobileHomeTabId;
  labelKey: TranslationKey;
  href: string;
  icon: ImageSourcePropType;
  /** Real Barber — dark variant (web `dark:invert`). */
  iconDark?: ImageSourcePropType;
  /** Menší asset z search-modal — centrovaný v 45px slotu. */
  searchModalIcon?: boolean;
  match: (pathname: string) => boolean;
};

function normalizePath(pathname: string): string {
  const base = pathname.split('?')[0]?.replace(/\/$/, '') || '/';
  return base || '/';
}

function pathEquals(pathname: string, target: string): boolean {
  return normalizePath(pathname) === normalizePath(target);
}

function pathStarts(pathname: string, prefix: string): boolean {
  const p = normalizePath(pathname);
  const t = normalizePath(prefix);
  return p === t || p.startsWith(`${t}/`);
}

/** Booking stack — aktivní tab „Mé rezervace“ (web `isBookingFlowPath`). */
export function isAppBookingFlowPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  return (
    p === '/screens/reservation-create' ||
    p === '/screens/reservation-create-start' ||
    p.startsWith('/screens/reservation-create')
  );
}

/** HomeTabs — pořadí a assety jako web `mobileHomeChrome.ts` (bez products). */
export const MOBILE_HOME_TABS: readonly MobileHomeTabDef[] = [
  {
    id: 'realBarber',
    labelKey: 'tabRealBarber',
    href: '/real-barber',
    icon: require('@/assets/img/wallet/realbarber-light.png'),
    iconDark: require('@/assets/img/wallet/realbarber-dark.png'),
    match: (p) => pathEquals(p, '/real-barber') || pathEquals(p, '/'),
  },
  {
    id: 'wallet',
    labelKey: 'tabWallet',
    href: '/wallet',
    icon: require('@/assets/img/wallet.png'),
    match: (p) => pathEquals(p, '/wallet'),
  },
  {
    id: 'myStyle',
    labelKey: 'tabMyHaircuts',
    href: '/my-haircuts',
    icon: require('@/assets/img/muj-styl-ikonka-home.png'),
    searchModalIcon: true,
    match: (p) => pathStarts(p, '/my-haircuts'),
  },
  {
    id: 'branches',
    labelKey: 'tabBranches',
    href: '/branches',
    icon: require('@/assets/img/branches.png'),
    match: (p) => pathStarts(p, '/branches') || pathStarts(p, '/branch-detail'),
  },
  {
    id: 'barbers',
    labelKey: 'tabBarbers',
    href: '/experience',
    icon: require('@/assets/img/barbers.png'),
    match: (p) => pathStarts(p, '/experience') || pathStarts(p, '/barber-detail'),
  },
  {
    id: 'favorites',
    labelKey: 'tabFavorites',
    href: '/favorites',
    icon: require('@/assets/img/search-modal-favorites.png'),
    searchModalIcon: true,
    match: (p) => pathStarts(p, '/favorites'),
  },
  {
    id: 'reservations',
    labelKey: 'tabReservations',
    href: '/bookings',
    icon: require('@/assets/img/search-modal-bookings.png'),
    searchModalIcon: true,
    match: (p) => pathStarts(p, '/bookings') || isAppBookingFlowPath(p),
  },
  {
    id: 'services',
    labelKey: 'tabServices',
    href: '/services',
    icon: require('@/assets/img/search-modal-services.png'),
    searchModalIcon: true,
    match: (p) => pathStarts(p, '/services') || pathStarts(p, '/service-detail'),
  },
  {
    id: 'map',
    labelKey: 'tabMap',
    href: '/screens/map',
    icon: require('@/assets/img/search-modal-branches.png'),
    searchModalIcon: true,
    match: (p) =>
      pathStarts(p, '/screens/map') ||
      pathStarts(p, '/screens/filters'),
  },
  {
    id: 'schedule',
    labelKey: 'tabSchedule',
    href: '/screens/schedule',
    icon: require('@/assets/img/search-modal-schedule.png'),
    searchModalIcon: true,
    match: (p) => pathStarts(p, '/screens/schedule'),
  },
  {
    id: 'inspirace',
    labelKey: 'tabInspirace',
    href: '/inspirace',
    icon: require('@/assets/img/inspirace.png'),
    match: (p) =>
      pathStarts(p, '/inspirace') || pathStarts(p, '/hairstyle-detail'),
  },
  {
    id: 'guides',
    labelKey: 'tabGuides',
    href: '/guides',
    icon: require('@/assets/img/home-tabs/guides.png'),
    match: (p) => pathStarts(p, '/guides'),
  },
] as const;

/** App: přihlášený uživatel — všechny taby kromě web-skrytých. */
export function visibleMobileHomeTabs(): MobileHomeTabDef[] {
  return [...MOBILE_HOME_TABS];
}

export function resolveActiveMobileHomeTabId(pathname: string): MobileHomeTabId | null {
  for (const tab of visibleMobileHomeTabs()) {
    if (tab.match(pathname)) return tab.id;
  }
  return null;
}
