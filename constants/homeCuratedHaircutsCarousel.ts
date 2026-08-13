import type { Locale } from '@/contexts/LanguageContext';
import { serviceDetailHref } from '@/constants/profileDetailRoutes';

export interface HaircutCarouselItem {
  id: string;
  title: string;
  image: number;
  href: string;
}

type CuratedHomeHaircut = {
  id: string;
  image: number;
  nameCs: string;
  nameEn: string;
  webUrlCs: string;
  webUrlEn: string;
};

/** Kurátorovaný katalog účesů — stejný obsah jako web `homeCuratedHaircutsCarousel.ts`. */
const HOME_CURATED_HAIRCUTS: CuratedHomeHaircut[] = [
  {
    id: '8b473993-da50-4423-8ba4-b14dabee52a9',
    image: require('@/assets/home/carousel/haircut-blow-taper-fade.webp'),
    nameCs: 'Blow Taper Fade',
    nameEn: 'Blow Taper Fade',
    webUrlCs: 'https://realbarber.cz/sluzby/blow-taper-fade/',
    webUrlEn: 'https://realbarber.cz/en/services/blow-taper-fade/',
  },
  {
    id: '7e982f97-0790-415b-9395-33c52e80032c',
    image: require('@/assets/home/carousel/haircut-burst-fade.webp'),
    nameCs: 'Burst Fade',
    nameEn: 'Burst Fade',
    webUrlCs: 'https://realbarber.cz/sluzby/burst-fade/',
    webUrlEn: 'https://realbarber.cz/en/services/burst-fade/',
  },
  {
    id: '8caa3d81-d416-48c7-a410-ede2b1714ad2',
    image: require('@/assets/home/carousel/haircut-caesar-cut.webp'),
    nameCs: 'Caesar Cut',
    nameEn: 'Caesar Cut',
    webUrlCs: 'https://realbarber.cz/sluzby/caesar-cut/',
    webUrlEn: 'https://realbarber.cz/en/services/caesar-cut/',
  },
  {
    id: 'f1eefeb4-5712-4ff4-8539-efb472f325db',
    image: require('@/assets/home/carousel/haircut-curly-top.webp'),
    nameCs: 'Curly Top',
    nameEn: 'Curly Top',
    webUrlCs: 'https://realbarber.cz/sluzby/curly-top/',
    webUrlEn: 'https://realbarber.cz/en/services/curly-top/',
  },
  {
    id: '385a5415-f847-48b6-9235-355f299b9357',
    image: require('@/assets/home/carousel/haircut-buzz-cut.webp'),
    nameCs: 'Buzz Cut',
    nameEn: 'Buzz Cut',
    webUrlCs: 'https://realbarber.cz/sluzby/buzz-cut-2/',
    webUrlEn: 'https://realbarber.cz/en/services/buzz-cut/',
  },
];

export function getHomeCuratedHaircutsCarousel(locale: Locale): HaircutCarouselItem[] {
  return HOME_CURATED_HAIRCUTS.map((item) => ({
    id: item.id,
    title: locale === 'en' ? item.nameEn : item.nameCs,
    image: item.image,
    href: serviceDetailHref(item.id),
  }));
}
