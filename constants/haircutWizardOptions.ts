import type { IconName } from '@/components/Icon';
import type { TranslationKey } from '@/locales';

/** Krok 1 – typ účesu (stejné jako v `add-property`). */
export const PROPERTY_TYPE_OPTIONS: ReadonlyArray<{
  labelKey: TranslationKey;
  iconImage: number;
  value: string;
}> = [
  { labelKey: 'addPropertyTypeShorter', iconImage: require('@/assets/img/type-shorter.png'), value: 'kratsi' },
  { labelKey: 'addPropertyTypeMediumLength', iconImage: require('@/assets/img/type-medium-length.png'), value: 'stredne_dlouhy' },
  { labelKey: 'addPropertyTypeLonger', iconImage: require('@/assets/img/type-longer.png'), value: 'delsi' },
  { labelKey: 'addPropertyTypeOffice', iconImage: require('@/assets/img/type-office.png'), value: 'do_kanclu' },
  { labelKey: 'addPropertyTypeSporty', iconImage: require('@/assets/img/type-sporty.png'), value: 'sportovni' },
  { labelKey: 'addPropertyTypeModern', iconImage: require('@/assets/img/type-modern.png'), value: 'moderni' },
  { labelKey: 'addPropertyTypeRetro', iconImage: require('@/assets/img/type-retro.png'), value: 'retro' },
  { labelKey: 'addPropertyTypeCasual', iconImage: require('@/assets/img/type-casual.png'), value: 'podpantoflak' },
];

/** Krok 2 – období. */
export const GUEST_ACCESS_OPTIONS: ReadonlyArray<{
  labelKey: TranslationKey;
  descKey: TranslationKey;
  iconImage: number;
  value: string;
}> = [
  {
    labelKey: 'addPropertySeasonSummer',
    descKey: 'addPropertySeasonSummerDesc',
    iconImage: require('@/assets/img/season-summer.png'),
    value: 'letni',
  },
  {
    labelKey: 'addPropertySeasonWinter',
    descKey: 'addPropertySeasonWinterDesc',
    iconImage: require('@/assets/img/season-winter.png'),
    value: 'zimni',
  },
  {
    labelKey: 'addPropertySeasonAllYear',
    descKey: 'addPropertySeasonAllYearDesc',
    iconImage: require('@/assets/img/season-all-year.png'),
    value: 'celorocni',
  },
];

/** Krok 4 – vlastnosti (ikonky Lucide jako ve wizardu). */
export const AMENITY_OPTIONS: ReadonlyArray<{
  label: string;
  labelKey: TranslationKey;
  icon: IconName;
}> = [
  { label: 'Want to try', labelKey: 'addPropertyAmenityWantToTry', icon: 'Sparkles' },
  { label: 'Low maintenance', labelKey: 'addPropertyAmenityLowMaintenance', icon: 'Check' },
  { label: 'Requires styling', labelKey: 'addPropertyAmenityRequiresStyling', icon: 'Zap' },
  { label: "Don't need to dry hair", labelKey: 'addPropertyAmenityNoDryHair', icon: 'Wind' },
  { label: 'Long lasting', labelKey: 'addPropertyAmenityLongLasting', icon: 'Clock' },
  { label: 'Haircut people compliment most', labelKey: 'addPropertyAmenityPeopleCompliment', icon: 'Users' },
  { label: 'My favourite haircut', labelKey: 'addPropertyAmenityMyFavourite', icon: 'Star' },
  { label: 'Looks good with beard', labelKey: 'addPropertyAmenityWithBeard', icon: 'CircleUser' },
  { label: 'Styling', labelKey: 'addPropertyAmenityStyling', icon: 'Sparkles' },
  { label: 'Trying something new', labelKey: 'addPropertyAmenitySomethingNew', icon: 'Lightbulb' },
  { label: 'Recommended by barber', labelKey: 'addPropertyAmenityRecommendedByBarber', icon: 'UserCheck' },
  { label: 'Came back to it', labelKey: 'addPropertyAmenityCameBack', icon: 'RotateCcw' },
];
