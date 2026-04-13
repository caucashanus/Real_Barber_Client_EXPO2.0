import type { TranslationKey } from '@/locales';
import type { HaircutNoteLine } from '@/utils/haircut-note';
import { matchesWizardLabel } from '@/utils/haircut-wizard-match';

/** Parsuje řádek „Štítek: a, b, c“ do pole `value` z wizard optionů (typ účesu / období). */
export function parseOverviewOptionValuesFromNote(
  note: string,
  lineLabelDisplay: string,
  options: readonly { value: string; labelKey: TranslationKey }[]
): string[] {
  const prefix = `${lineLabelDisplay}:`;
  const line = getNoteLines(note).find((l) => l.startsWith(prefix));
  if (!line) return [];
  const rest = line.slice(prefix.length).trim();
  const tags = rest
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const values: string[] = [];
  for (const tag of tags) {
    const opt = options.find((o) => matchesWizardLabel(tag, o.labelKey));
    if (opt) values.push(opt.value);
  }
  return values;
}

export function getNoteLines(note: string): string[] {
  return note
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function joinNoteLines(lines: string[]): string {
  return lines.join('\n');
}

export function removeLineAt(note: string, index: number): string {
  const lines = getNoteLines(note);
  if (index < 0 || index >= lines.length) return note;
  return joinNoteLines(lines.filter((_, i) => i !== index));
}

export function upsertLabeledLine(note: string, label: string, value: string): string {
  const lines = getNoteLines(note);
  const prefix = `${label}:`;
  const idx = lines.findIndex((l) => l.startsWith(prefix));
  const newLine = `${label}: ${value}`;
  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    lines.push(newLine);
  }
  return joinNoteLines(lines);
}

export function removeLineWithLabel(note: string, label: string): string {
  const lines = getNoteLines(note);
  const prefix = `${label}:`;
  return joinNoteLines(lines.filter((l) => !l.startsWith(prefix)));
}

export function appendFeatureTags(note: string, newTags: string[], featuresLabel: string): string {
  const lines = getNoteLines(note);
  const prefix = `${featuresLabel}:`;
  const idx = lines.findIndex((l) => l.startsWith(prefix));
  const existing =
    idx >= 0
      ? lines[idx]
          .slice(prefix.length)
          .trim()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const merged = [...new Set([...existing, ...newTags])];
  const line = `${featuresLabel}: ${merged.join(', ')}`;
  if (idx >= 0) lines[idx] = line;
  else lines.push(line);
  return joinNoteLines(lines);
}

export function removeFeatureTagFromNote(
  note: string,
  tagToRemove: string,
  featuresLabel: string
): string {
  const lines = getNoteLines(note);
  const prefix = `${featuresLabel}:`;
  const idx = lines.findIndex((l) => l.startsWith(prefix));
  if (idx < 0) return note;
  const rest = lines[idx].slice(prefix.length).trim();
  const tags = rest
    .split(',')
    .map((s) => s.trim())
    .filter((t) => t && t !== tagToRemove);
  if (tags.length === 0) {
    return removeLineAt(note, idx);
  }
  lines[idx] = `${featuresLabel}: ${tags.join(', ')}`;
  return joinNoteLines(lines);
}

export function findParsedLineIndex(parsed: HaircutNoteLine[], row: HaircutNoteLine): number {
  return parsed.findIndex((l) =>
    row.label ? l.label === row.label && l.value === row.value : !l.label && l.value === row.value
  );
}

export function parseDifficultyPercent(note: string, difficultyLabel: string): number {
  const lines = getNoteLines(note);
  const prefix = `${difficultyLabel}:`;
  const line = lines.find((l) => l.startsWith(prefix));
  if (!line) return 50;
  const m = line.match(/:\s*(\d+)\s*%/);
  return m ? Math.min(100, Math.max(0, parseInt(m[1], 10))) : 50;
}

export function parseDescriptionFromNote(note: string, descLabel: string): string {
  const lines = getNoteLines(note);
  const prefix = `${descLabel}:`;
  const line = lines.find((l) => l.startsWith(prefix));
  if (!line) return '';
  const idx = line.indexOf(':');
  return idx >= 0 ? line.slice(idx + 1).trim() : '';
}

export function parseMeasurementValues(
  note: string,
  labels: { ears: string; top: string; weeks: string }
): { ears: number; top: number; weeks: number } {
  const lines = getNoteLines(note);
  const out = { ears: 0, top: 0, weeks: 4 };
  for (const line of lines) {
    if (line.startsWith(`${labels.ears}:`)) {
      const m = line.match(/:\s*(\d+)\s*cm/);
      if (m) out.ears = parseInt(m[1], 10);
    } else if (line.startsWith(`${labels.top}:`)) {
      const m = line.match(/:\s*(\d+)\s*cm/);
      if (m) out.top = parseInt(m[1], 10);
    } else if (line.startsWith(`${labels.weeks}:`)) {
      const m = line.match(/:\s*(\d+)/);
      if (m) out.weeks = parseInt(m[1], 10);
    }
  }
  return out;
}
