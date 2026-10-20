import type { IconName } from '@/components/Icon';
import type { TranslationKey } from '@/locales';

export type KidsWatchAvoidId =
  | 'candy'
  | 'sweetDrink'
  | 'nuts'
  | 'dairy'
  | 'stylingProducts'
  | 'shampooConditioner';

export type KidsWatchAvoidOption = {
  id: KidsWatchAvoidId;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: IconName;
  image: number;
};

/** Parita web KidsWatch + `public/home/kids/avoid-*.png` */
export const KIDS_WATCH_AVOID_OPTIONS: readonly KidsWatchAvoidOption[] = [
  {
    id: 'candy',
    labelKey: 'kidsWatchAvoidCandy',
    descriptionKey: 'kidsWatchAvoidCandyDesc',
    icon: 'Candy',
    image: require('@/assets/img/home/kids/avoid-sweets.png'),
  },
  {
    id: 'sweetDrink',
    labelKey: 'kidsWatchAvoidSweetDrinks',
    descriptionKey: 'kidsWatchAvoidSweetDrinksDesc',
    icon: 'CupSoda',
    image: require('@/assets/img/home/kids/avoid-sweet-drinks.png'),
  },
  {
    id: 'nuts',
    labelKey: 'kidsWatchAvoidNuts',
    descriptionKey: 'kidsWatchAvoidNutsDesc',
    icon: 'Nut',
    image: require('@/assets/img/home/kids/avoid-nuts.png'),
  },
  {
    id: 'dairy',
    labelKey: 'kidsWatchAvoidDairy',
    descriptionKey: 'kidsWatchAvoidDairyDesc',
    icon: 'Milk',
    image: require('@/assets/img/home/kids/avoid-dairy.png'),
  },
  {
    id: 'stylingProducts',
    labelKey: 'kidsWatchAvoidStyling',
    descriptionKey: 'kidsWatchAvoidStylingDesc',
    icon: 'Sparkles',
    image: require('@/assets/img/home/kids/avoid-styling.png'),
  },
  {
    id: 'shampooConditioner',
    labelKey: 'kidsWatchAvoidShampoo',
    descriptionKey: 'kidsWatchAvoidShampooDesc',
    icon: 'Droplets',
    image: require('@/assets/img/home/kids/avoid-shampoo.png'),
  },
] as const;
