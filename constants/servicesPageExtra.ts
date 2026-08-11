import type { TranslationKey } from '@/locales';

const UPLOAD = 'https://s3.xrb.cz/site/2024/07';

export interface ExtraServiceStaticItem {
  id: string;
  badgeKey: TranslationKey;
  titleKey: TranslationKey;
  priceFrom: number;
  imageSrc: string;
  webUrlCs: string;
  webUrlEn?: string;
}

/** Statické doplňkové karty — stejné jako web `src/data/servicesPage.ts` extraServices. */
export const EXTRA_SERVICES_STATIC: ExtraServiceStaticItem[] = [
  {
    id: 'epilace',
    badgeKey: 'servicesExtraEpilaceBadge',
    titleKey: 'servicesExtraEpilaceTitle',
    priceFrom: 0,
    imageSrc: `${UPLOAD}/epilace-horkym-voskem-nahled-683x1024.webp`,
    webUrlCs: 'https://realbarber.cz/sluzby/epilace-horkym-voskem/',
    webUrlEn: 'https://realbarber.cz/en/services/hot-wax-epilation/',
  },
  {
    id: 'video-na-miru',
    badgeKey: 'servicesExtraVideoBadge',
    titleKey: 'servicesExtraVideoTitle',
    priceFrom: 1500,
    imageSrc: `${UPLOAD}/video-na-miru-nahled-683x1024.webp`,
    webUrlCs: 'https://realbarber.cz/sluzby/video-na-miru/',
    webUrlEn: 'https://realbarber.cz/en/services/custom-video/',
  },
  {
    id: 'sluzby-domu',
    badgeKey: 'servicesExtraHomeBadge',
    titleKey: 'servicesExtraHomeTitle',
    priceFrom: 1000,
    imageSrc: `${UPLOAD}/nahled-sluzby-domu-1-683x1024.webp`,
    webUrlCs: 'https://realbarber.cz/sluzby/sluzby-domu/',
    webUrlEn: 'https://realbarber.cz/en/services/home-services/',
  },
];
