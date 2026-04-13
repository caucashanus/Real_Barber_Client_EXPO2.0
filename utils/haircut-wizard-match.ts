import type { IconName } from '@/components/Icon';
import {
  AMENITY_OPTIONS,
  GUEST_ACCESS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from '@/constants/haircutWizardOptions';
import type { TranslationKey } from '@/locales';
import { getTranslation } from '@/locales';

/** Porovná uložený přeložený text s oběma locale (poznámka může být v CS i EN). */
export function matchesWizardLabel(value: string, labelKey: TranslationKey): boolean {
  const v = value.trim();
  return v === getTranslation('cs', labelKey) || v === getTranslation('en', labelKey);
}

export function resolvePropertyTypeIcon(value: string): number | undefined {
  for (const opt of PROPERTY_TYPE_OPTIONS) {
    if (matchesWizardLabel(value, opt.labelKey)) return opt.iconImage;
  }
  return undefined;
}

export function resolveSeasonIcon(value: string): number | undefined {
  for (const opt of GUEST_ACCESS_OPTIONS) {
    if (matchesWizardLabel(value, opt.labelKey)) return opt.iconImage;
  }
  return undefined;
}

export function resolveOverviewRowIcon(value: string): number | undefined {
  return resolvePropertyTypeIcon(value) ?? resolveSeasonIcon(value);
}

/** Stejná logika jako ve wizardu u typu „delší“ – větší obrázek. */
export function isLongerHaircutTypeLabel(value: string): boolean {
  return matchesWizardLabel(value, 'addPropertyTypeLonger');
}

export function resolveAmenityIcon(tag: string): IconName | undefined {
  for (const opt of AMENITY_OPTIONS) {
    if (matchesWizardLabel(tag, opt.labelKey)) return opt.icon;
  }
  return undefined;
}
