import type { ImageSourcePropType } from 'react-native';

import type { TranslationKey } from '@/locales';

export type HomeMoreCircleId = 'style' | 'kids' | 'guides' | 'interval';

export type HomeMoreCircleDef = {
  id: HomeMoreCircleId;
  labelKey: TranslationKey;
  icon: ImageSourcePropType;
  /** Menší ikona uvnitř kruhu (search-modal scale). */
  imageInset?: boolean;
};

/** „Pro tebe“ — Můj styl, Děti, Návody, Můj interval (web `homeMoreCircles.ts`). */
export const HOME_MORE_CIRCLES: readonly HomeMoreCircleDef[] = [
  {
    id: 'style',
    labelKey: 'homeMoreStyle',
    icon: require('@/assets/img/muj-styl-ikonka-home.png'),
    imageInset: true,
  },
  {
    id: 'kids',
    labelKey: 'homeMoreKids',
    icon: require('@/assets/img/home/fast-book/vlasy-do-12-let-ikonka.webp'),
    imageInset: true,
  },
  {
    id: 'guides',
    labelKey: 'homeMoreGuides',
    icon: require('@/assets/img/home-tabs/guides.png'),
  },
  {
    id: 'interval',
    labelKey: 'homeMoreInterval',
    icon: require('@/assets/img/home/visit-plan/muj-plan-navstev-ikonka.png'),
    imageInset: true,
  },
] as const;
