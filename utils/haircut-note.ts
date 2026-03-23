/** Části UI – odpovídají řádkům z `buildHaircutNote` ve wizardu. */
export type HaircutNoteSectionId =
  | 'overview'
  | 'measurements'
  | 'features'
  | 'difficulty'
  | 'description'
  | 'other';

export interface HaircutNoteLine {
  label: string;
  value: string;
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Zařadí řádek „Štítek: hodnota“ do sekce podle štítku (CS/EN z wizardu). */
export function classifyHaircutNoteLabel(label: string): HaircutNoteSectionId {
  const n = normalizeForMatch(label);

  if (
    n.includes('typ ucesu') ||
    n.includes('haircut type') ||
    (n.includes('typ') && n.includes('uces'))
  ) {
    return 'overview';
  }
  if (n.includes('obdobi') || n.includes('season')) return 'overview';

  if (n.includes('delka') || n.includes('length')) return 'measurements';
  if (
    n.includes('jak casto') ||
    n.includes('how often') ||
    n.includes('upravu') ||
    n.includes('trim')
  ) {
    return 'measurements';
  }

  if (n.includes('vlastnost') || n.includes('feature')) return 'features';

  if (
    n.includes('obtiznost') ||
    n.includes('obtížnost') ||
    n.includes('narocnost') ||
    n.includes('náročnost') ||
    n.includes('difficulty')
  ) {
    return 'difficulty';
  }

  if (n.includes('popis') || n.includes('description')) return 'description';

  return 'other';
}

export function parseHaircutNoteLines(note: string | null | undefined): HaircutNoteLine[] {
  if (!note?.trim()) return [];
  return note
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { label: '', value: line };
      return {
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      };
    });
}

export function bucketHaircutNoteLines(
  lines: HaircutNoteLine[]
): Record<HaircutNoteSectionId, HaircutNoteLine[]> {
  const empty: Record<HaircutNoteSectionId, HaircutNoteLine[]> = {
    overview: [],
    measurements: [],
    features: [],
    difficulty: [],
    description: [],
    other: [],
  };

  for (const row of lines) {
    if (!row.label) {
      empty.other.push(row);
      continue;
    }
    const sec = classifyHaircutNoteLabel(row.label);
    empty[sec].push(row);
  }
  return empty;
}

export const HAIRCUT_NOTE_SECTION_ORDER: HaircutNoteSectionId[] = [
  'overview',
  'measurements',
  'features',
  'difficulty',
  'description',
  'other',
];
