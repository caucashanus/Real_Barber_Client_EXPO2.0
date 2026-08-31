import catalog from "@/lib/rbicek/port/data/inspiraceHaircuts.generated.json";

export type InspiraceHaircutBarber = {
  name: string;
  /** Pathname z CRM webUrl, např. `/tym/alex/`. Null když CRM odkaz nemá. */
  webUrl: string | null;
};

export type InspiraceSimilarHaircut = {
  name: string;
  webUrl: string | null;
  slug: string | null;
};

export type InspiraceHaircut = {
  id: string;
  slug: string;
  name: string;
  webUrl: string;
  description: string | null;
  intendedFor: string | null;
  faceShapes: string[];
  hairTypes: string[];
  stylingDifficulty: number | null;
  popularity: number | null;
  tag: string | null;
  barbers: InspiraceHaircutBarber[];
  similar: InspiraceSimilarHaircut[];
};

const FACE_SHAPE_LABELS: Record<string, string> = {
  oval: "Oválný",
  round: "Kulatý",
  square: "Hranatý",
  rectangular: "Obdélníkový",
  heart: "Srdcový",
  diamond: "Diamantový",
  triangle: "Trojúhelníkový",
};

export const INSPIRACE_HAIRCUTS: InspiraceHaircut[] = (
  catalog.items as Array<
    Omit<InspiraceHaircut, "barbers" | "similar"> & {
      barbers?: Array<string | InspiraceHaircutBarber>;
      similar?: InspiraceSimilarHaircut[];
    }
  >
).map((item) => ({
  ...item,
  barbers: (item.barbers ?? []).map((barber) =>
    typeof barber === "string"
      ? { name: barber, webUrl: null }
      : { name: barber.name, webUrl: barber.webUrl ?? null },
  ),
  similar: item.similar ?? [],
}));

export const HAIRCUTS_PAGE_SIZE = 6;

export const FEATURED_HAIRCUT_SLUGS = [
  "low-taper-fade",
  "caesar-cut",
  "curly-top",
  "crop",
  "buzz-cut-2",
  "mullet",
] as const;

export function haircutNodeId(slug: string): string {
  return `svc_haircut_${slug.replace(/-/g, "_")}`;
}

export function haircutPickId(slug: string): string {
  return `svc_haircut_pick_${slug.replace(/-/g, "_")}`;
}

export function formatFaceShapes(faceShapes: string[]): string | null {
  const labels = faceShapes
    .map((key) => FACE_SHAPE_LABELS[key])
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return null;
  return labels.join(", ");
}

function formatNameList(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} a ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} a ${names.at(-1)}`;
}

function sanitizeUserText(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ");
}

export function haircutChatMessage(haircut: InspiraceHaircut): string {
  const parts: string[] = [];

  if (haircut.description) {
    parts.push(sanitizeUserText(haircut.description));
  }

  if (haircut.intendedFor) {
    parts.push(sanitizeUserText(haircut.intendedFor));
  }

  const faceShapes = formatFaceShapes(haircut.faceShapes);
  if (faceShapes) {
    parts.push(`Vhodné tvary obličeje: ${faceShapes}.`);
  }

  if (haircut.stylingDifficulty != null) {
    parts.push(`Náročnost stylingu ${haircut.stylingDifficulty}/5.`);
  }

  const barberNames = formatNameList(haircut.barbers.map((b) => b.name));
  if (barberNames) {
    parts.push(
      `Rádi ho stříhají ${barberNames}. Profily holičů otevřete tlačítky níže.`,
    );
  }

  const similarNames = formatNameList(haircut.similar.map((s) => s.name));
  if (similarNames) {
    parts.push(
      `Podobné účesy: ${similarNames}. Odkazy najdete u tlačítek níže.`,
    );
  }

  return parts.join("\n\n");
}

export function getFeaturedHaircuts(): InspiraceHaircut[] {
  const bySlug = new Map(INSPIRACE_HAIRCUTS.map((item) => [item.slug, item]));
  const featured: InspiraceHaircut[] = [];

  for (const slug of FEATURED_HAIRCUT_SLUGS) {
    const item = bySlug.get(slug);
    if (item) featured.push(item);
  }

  if (featured.length >= 6) return featured.slice(0, 6);

  const rest = INSPIRACE_HAIRCUTS.filter(
    (item) => !featured.some((f) => f.slug === item.slug),
  )
    .sort((a, b) => {
      const popA = a.popularity ?? 0;
      const popB = b.popularity ?? 0;
      if (popB !== popA) return popB - popA;
      return a.name.localeCompare(b.name, "cs");
    })
    .slice(0, 6 - featured.length);

  return [...featured, ...rest];
}

export function paginateHaircuts(
  items: InspiraceHaircut[],
  pageSize = HAIRCUTS_PAGE_SIZE,
): InspiraceHaircut[][] {
  const pages: InspiraceHaircut[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

export const INSPIRACE_HAIRCUT_PAGES = paginateHaircuts(INSPIRACE_HAIRCUTS);
