import type { TranslationKey } from '@/locales';
import {
  AMENITY_OPTIONS,
  GUEST_ACCESS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from '@/constants/haircutWizardOptions';

/** Stejné pole jako ve wizardu `add-property` – serializuje se do `note` přes `buildHaircutNote`. */
export interface HaircutWizardPropertyData {
  propertyType: string;
  guestAccessType: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  title: string;
  description: string;
  characteristics: string[];
  stylingDifficulty: number;
  barber_id: string;
}

export function stylingDifficultyLabel(value: number): string {
  if (value <= 16) return 'Very easy';
  if (value <= 33) return 'Easy';
  if (value <= 50) return 'Medium';
  if (value <= 66) return 'Trickier';
  if (value <= 83) return 'Demanding';
  return 'Very demanding';
}

export function buildHaircutNote(
  data: HaircutWizardPropertyData,
  t: (key: TranslationKey) => string
): string {
  const lines: string[] = [];
  const typeOpt = PROPERTY_TYPE_OPTIONS.find((o) => o.value === data.propertyType);
  if (typeOpt) lines.push(`${t('addPropertyStepHaircutType')}: ${t(typeOpt.labelKey as TranslationKey)}`);
  const seasonOpt = GUEST_ACCESS_OPTIONS.find((o) => o.value === data.guestAccessType);
  if (seasonOpt) lines.push(`${t('addPropertyStepSeason')}: ${t(seasonOpt.labelKey as TranslationKey)}`);
  lines.push(
    `${t('addPropertyLengthAtEars')}: ${data.guests} cm`,
    `${t('addPropertyLengthOnTop')}: ${data.bedrooms} cm`,
    `${t('addPropertyHowOftenTrim')}: ${data.beds} ${t('addPropertyWeeksUnit')}`
  );
  if (data.amenities.length > 0) {
    const labels = data.amenities.map((label) => {
      const opt = AMENITY_OPTIONS.find((a) => a.label === label);
      return opt ? t(opt.labelKey as TranslationKey) : label;
    });
    lines.push(`${t('addPropertyStepFeatures')}: ${labels.join(', ')}`);
  }
  lines.push(`${t('addPropertyDifficulty')}: ${Math.round(data.stylingDifficulty)}%`);
  if (data.description.trim()) {
    lines.push(`${t('addPropertyDescription')}: ${data.description.trim()}`);
  }
  return lines.join('\n');
}
