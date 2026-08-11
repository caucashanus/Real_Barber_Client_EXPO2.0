import type { Locale } from '@/contexts/LanguageContext';

type EnumLabels = Record<string, string>;
type EnumGroup = 'faceShapes' | 'hairTypes' | 'hairProperties' | 'hairLengths';

const FACE_SHAPE_LABELS: Record<Locale, EnumLabels> = {
  cs: {
    oval: "Oválný",
    round: "Kulatý",
    square: "Hranatý",
    rectangular: "Obdélníkový",
    heart: "Srdcový",
    diamond: "Diamantový",
    triangle: "Trojúhelníkový",
  },
  en: {
    oval: "Oval",
    round: "Round",
    square: "Square",
    rectangular: "Rectangular",
    heart: "Heart",
    diamond: "Diamond",
    triangle: "Triangle",
  },
};

const HAIR_TYPE_LABELS: Record<Locale, EnumLabels> = {
  cs: {
    straight: "Rovné",
    slightly_wavy: "Lehce vlnité",
    wavy: "Vlnité",
    strongly_wavy: "Silně vlnité",
    curly: "Kudrnaté",
    strongly_curly: "Silně kudrnaté",
    african: "Africký typ",
    european: "Evropský typ",
    asian: "Asijský typ",
    latin: "Latinskoamerický typ",
  },
  en: {
    straight: "Straight",
    slightly_wavy: "Slightly wavy",
    wavy: "Wavy",
    strongly_wavy: "Strongly wavy",
    curly: "Curly",
    strongly_curly: "Strongly curly",
    african: "African type",
    european: "European type",
    asian: "Asian type",
    latin: "Latin American type",
  },
};

const HAIR_PROPERTY_LABELS: Record<Locale, EnumLabels> = {
  cs: {
    fine: "Jemné",
    medium_thickness: "Středně silné",
    thick_strand: "Silné",
    coarse: "Hrubé",
    thin: "Tenké",
    dense: "Husté",
    sparse: "Řídké",
    normal_density: "Normální hustota",
    pliant: "Poddajné",
    unpliant: "Nepoddajné",
    voluminous: "Objemné",
    flat: "Splihlé",
    dry: "Suché",
    oily: "Mastné",
    healthy: "Zdravé",
    damaged: "Poškozené",
    colored: "Barvené",
    bleached: "Odbarvené",
    soft: "Měkké",
    hard: "Tvrdé",
    shiny: "Lesklé",
    dull: "Matné",
  },
  en: {
    fine: "Fine",
    medium_thickness: "Medium thickness",
    thick_strand: "Thick",
    coarse: "Coarse",
    thin: "Thin",
    dense: "Dense",
    sparse: "Sparse",
    normal_density: "Normal density",
    pliant: "Pliable",
    unpliant: "Unpliant",
    voluminous: "Voluminous",
    flat: "Flat",
    dry: "Dry",
    oily: "Oily",
    healthy: "Healthy",
    damaged: "Damaged",
    colored: "Colored",
    bleached: "Bleached",
    soft: "Soft",
    hard: "Hard",
    shiny: "Shiny",
    dull: "Dull",
  },
};

const HAIR_LENGTH_LABELS: Record<Locale, EnumLabels> = {
  cs: {
    very_short: "Velmi krátké",
    short: "Krátké",
    medium_short: "Středně krátké",
    medium: "Střední",
    medium_long: "Středně dlouhé",
    long: "Dlouhé",
    very_long: "Velmi dlouhé",
  },
  en: {
    very_short: "Very short",
    short: "Short",
    medium_short: "Medium short",
    medium: "Medium",
    medium_long: "Medium long",
    long: "Long",
    very_long: "Very long",
  },
};

const LABEL_MAP: Record<EnumGroup, Record<Locale, EnumLabels>> = {
  faceShapes: FACE_SHAPE_LABELS,
  hairTypes: HAIR_TYPE_LABELS,
  hairProperties: HAIR_PROPERTY_LABELS,
  hairLengths: HAIR_LENGTH_LABELS,
};

export function labelHairstyleEnumValues(
  group: EnumGroup,
  keys: string[],
  locale: Locale
): string[] {
  const map = LABEL_MAP[group][locale] ?? LABEL_MAP[group].cs;
  return keys.map((key) => map[key] ?? key).filter(Boolean);
}
