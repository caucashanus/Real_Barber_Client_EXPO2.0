import type { TranslationKey } from '@/locales';
import {
  AMENITY_OPTIONS,
  GUEST_ACCESS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from '@/constants/haircutWizardOptions';

/** Stejné pole jako ve wizardu `add-property` – serializuje se do `note` přes `buildHaircutNote`. */
export interface HaircutWizardPropertyData {
  /** Hodnoty z `PROPERTY_TYPE_OPTIONS` (např. `kratsi`) – může jich být víc. */
  propertyTypes: string[];
  /** Hodnoty z `GUEST_ACCESS_OPTIONS` (např. `letni`) – může jich být víc. */
  guestAccessTypes: string[];
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
  if (data.propertyTypes.length > 0) {
    const labels = data.propertyTypes
      .map((val) => {
        const opt = PROPERTY_TYPE_OPTIONS.find((o) => o.value === val);
        return opt ? t(opt.labelKey as TranslationKey) : val;
      })
      .filter(Boolean);
    if (labels.length > 0) {
      lines.push(`${t('addPropertyStepHaircutType')}: ${labels.join(', ')}`);
    }
  }
  if (data.guestAccessTypes.length > 0) {
    const labels = data.guestAccessTypes
      .map((val) => {
        const opt = GUEST_ACCESS_OPTIONS.find((o) => o.value === val);
        return opt ? t(opt.labelKey as TranslationKey) : val;
      })
      .filter(Boolean);
    if (labels.length > 0) {
      lines.push(`${t('addPropertyStepSeason')}: ${labels.join(', ')}`);
    }
  }
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
