import type { IconName } from '@/components/Icon';
import type { TranslationKey } from '@/locales';

/** Krok 1 – typ účesu (stejné jako v `haircut-create`). */
export const PROPERTY_TYPE_OPTIONS: readonly {
  labelKey: TranslationKey;
  iconImage: number;
  value: string;
}[] = [
  {
    labelKey: 'haircutCreateTypeShorter',
    iconImage: require('@/assets/img/type-shorter.png'),
    value: 'kratsi',
  },
  {
    labelKey: 'haircutCreateTypeMediumLength',
    iconImage: require('@/assets/img/type-medium-length.png'),
    value: 'stredne_dlouhy',
  },
  {
    labelKey: 'haircutCreateTypeLonger',
    iconImage: require('@/assets/img/type-longer.png'),
    value: 'delsi',
  },
  {
    labelKey: 'haircutCreateTypeOffice',
    iconImage: require('@/assets/img/type-office.png'),
    value: 'do_kanclu',
  },
  {
    labelKey: 'haircutCreateTypeSporty',
    iconImage: require('@/assets/img/type-sporty.png'),
    value: 'sportovni',
  },
  {
    labelKey: 'haircutCreateTypeModern',
    iconImage: require('@/assets/img/type-modern.png'),
    value: 'moderni',
  },
  {
    labelKey: 'haircutCreateTypeRetro',
    iconImage: require('@/assets/img/type-retro.png'),
    value: 'retro',
  },
  {
    labelKey: 'haircutCreateTypeCasual',
    iconImage: require('@/assets/img/type-casual.png'),
    value: 'podpantoflak',
  },
];

/** Krok 2 – období. */
export const GUEST_ACCESS_OPTIONS: readonly {
  labelKey: TranslationKey;
  descKey: TranslationKey;
  iconImage: number;
  value: string;
}[] = [
  {
    labelKey: 'haircutCreateSeasonSummer',
    descKey: 'haircutCreateSeasonSummerDesc',
    iconImage: require('@/assets/img/season-summer.png'),
    value: 'letni',
  },
  {
    labelKey: 'haircutCreateSeasonWinter',
    descKey: 'haircutCreateSeasonWinterDesc',
    iconImage: require('@/assets/img/season-winter.png'),
    value: 'zimni',
  },
  {
    labelKey: 'haircutCreateSeasonAllYear',
    descKey: 'haircutCreateSeasonAllYearDesc',
    iconImage: require('@/assets/img/season-all-year.png'),
    value: 'celorocni',
  },
];

/** Krok 4 – vlastnosti (ikonky Lucide jako ve wizardu). */
export const AMENITY_OPTIONS: readonly {
  label: string;
  labelKey: TranslationKey;
  icon: IconName;
}[] = [
  { label: 'Want to try', labelKey: 'haircutCreateAmenityWantToTry', icon: 'Sparkles' },
  { label: 'Low maintenance', labelKey: 'haircutCreateAmenityLowMaintenance', icon: 'Check' },
  { label: 'Requires styling', labelKey: 'haircutCreateAmenityRequiresStyling', icon: 'Zap' },
  { label: "Don't need to dry hair", labelKey: 'haircutCreateAmenityNoDryHair', icon: 'Wind' },
  { label: 'Long lasting', labelKey: 'haircutCreateAmenityLongLasting', icon: 'Clock' },
  {
    label: 'Haircut people compliment most',
    labelKey: 'haircutCreateAmenityPeopleCompliment',
    icon: 'Users',
  },
  { label: 'My favourite haircut', labelKey: 'haircutCreateAmenityMyFavourite', icon: 'Star' },
  { label: 'Looks good with beard', labelKey: 'haircutCreateAmenityWithBeard', icon: 'CircleUser' },
  { label: 'Styling', labelKey: 'haircutCreateAmenityStyling', icon: 'Sparkles' },
  {
    label: 'Trying something new',
    labelKey: 'haircutCreateAmenitySomethingNew',
    icon: 'Lightbulb',
  },
  {
    label: 'Recommended by barber',
    labelKey: 'haircutCreateAmenityRecommendedByBarber',
    icon: 'UserCheck',
  },
  { label: 'Came back to it', labelKey: 'haircutCreateAmenityCameBack', icon: 'RotateCcw' },
];
