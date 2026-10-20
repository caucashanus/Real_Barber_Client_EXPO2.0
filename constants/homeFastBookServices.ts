import type { TranslationKey } from '@/locales';
import { KIDS_HAIRCUT_CRM_ITEM_ID } from '@/constants/kidsHaircutBooking';

export type HomeFastBookServiceId = 'hair' | 'hairBeard' | 'beard' | 'kids';

export type HomeFastBookService = {
  id: HomeFastBookServiceId;
  crmId: string;
  identitySlug: string;
  iconImage: number;
};

/** Parita s webem `homeFastBookServices.ts` — CRM UUID + booking slug. */
export const HOME_FAST_BOOK_SERVICES: readonly HomeFastBookService[] = [
  {
    id: 'hair',
    crmId: 'd557b4b5-5b26-4650-bdbe-0ed45f1acf95',
    identitySlug: 'barber-klasicke-moderni-strihani-vlasu',
    iconImage: require('@/assets/img/home/fast-book/vlasy-ikonka.webp'),
  },
  {
    id: 'hairBeard',
    crmId: '3aaacd1b-e558-4b67-bec3-cf3d60e82f03',
    identitySlug: 'kompletni-pece-real-barber',
    iconImage: require('@/assets/img/home/fast-book/vlasy-a-vousy-ikonka.webp'),
  },
  {
    id: 'beard',
    crmId: 'f1c7afb4-adda-4e7f-a2df-b6223073f3d9',
    identitySlug: 'uprava-vousu',
    iconImage: require('@/assets/img/home/fast-book/vousy-ikonka.webp'),
  },
  {
    id: 'kids',
    crmId: KIDS_HAIRCUT_CRM_ITEM_ID,
    identitySlug: 'detske-strihani-do-12-let',
    iconImage: require('@/assets/img/home/fast-book/vlasy-do-12-let-ikonka.webp'),
  },
] as const;

export const HOME_FAST_BOOK_SERVICE_LABEL_KEYS: Record<
  HomeFastBookServiceId,
  TranslationKey
> = {
  hair: 'fastBookServiceHair',
  hairBeard: 'fastBookServiceHairBeard',
  beard: 'fastBookServiceBeard',
  kids: 'fastBookServiceKids',
};
