/**
 * Sync locales/cs.ts, locales/en.ts and generate locales/uk.ts from docs/app-static-texts-filled.csv.
 *
 * Usage: node scripts/sync-locales-from-csv.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'docs/app-static-texts-filled.csv');
const CS_PATH = path.join(ROOT, 'locales/cs.ts');
const EN_PATH = path.join(ROOT, 'locales/en.ts');
const UK_PATH = path.join(ROOT, 'locales/uk.ts');

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function readField() {
    if (text[i] === '"') {
      i += 1;
      let field = '';
      while (i < len) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        field += text[i];
        i += 1;
      }
      if (text[i] === ',') i += 1;
      return field;
    }

    const start = i;
    while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') i += 1;
    const field = text.slice(start, i);
    if (text[i] === ',') i += 1;
    return field;
  }

  while (i < len) {
    if (text[i] === '\r') {
      i += 1;
      continue;
    }
    if (text[i] === '\n') {
      i += 1;
      continue;
    }

    const row = [];
    while (i < len && text[i] !== '\n' && text[i] !== '\r') {
      row.push(readField());
    }
    if (row.length === 1 && row[0] === '') break;
    rows.push(row);
    while (i < len && (text[i] === '\n' || text[i] === '\r')) i += 1;
  }

  const [header, ...data] = rows;
  const headerIndex = Object.fromEntries(header.map((h, idx) => [h, idx]));
  return data.map((cells) => {
    const get = (name) => cells[headerIndex[name]] ?? '';
    return {
      key: get('key'),
      cs: get('cs'),
      en: get('en'),
      uk: get('uk'),
      csWebSuggested: get('cs_web_suggested'),
      enWebSuggested: get('en_web_suggested'),
    };
  });
}

function escapeTsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatTsValue(value) {
  const escaped = escapeTsString(value);
  if (!escaped.includes('\n')) {
    return `'${escaped}'`;
  }
  const lines = escaped.split('\n');
  return `'${lines.join("' +\n    '")}'`;
}

function replaceLocaleKey(content, key, value) {
  const formatted = formatTsValue(value);
  const singleLine = new RegExp(`^(\\s+${key}:\\s+)('(?:\\\\'|[^'])*'|"(?:\\\\"|[^"])*"),?$`, 'm');
  if (singleLine.test(content)) {
    return content.replace(singleLine, `$1${formatted},`);
  }

  const multiLine = new RegExp(
    `^(\\s+${key}:\\s*\\n\\s+)(?:'(?:\\\\'|[^'])*'|"[^"]*"),?$`,
    'm'
  );
  if (multiLine.test(content)) {
    const indented =
      formatted.includes('\n')
        ? formatted
            .split('\n')
            .map((line, idx) => (idx === 0 ? line : `    ${line}`))
            .join('\n')
        : formatted;
    return content.replace(multiLine, `$1${indented},`);
  }

  throw new Error(`Could not replace key "${key}" in locale file`);
}

function main() {
  const csvRows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  const byKey = new Map(csvRows.map((row) => [row.key, row]));

  let csContent = fs.readFileSync(CS_PATH, 'utf8');
  let enContent = fs.readFileSync(EN_PATH, 'utf8');

  let csPatches = 0;
  let enPatches = 0;

  for (const row of csvRows) {
    if (row.csWebSuggested) {
      csContent = replaceLocaleKey(csContent, row.key, row.csWebSuggested);
      csPatches += 1;
    }
    if (row.enWebSuggested) {
      enContent = replaceLocaleKey(enContent, row.key, row.enWebSuggested);
      enPatches += 1;
    }
  }

  fs.writeFileSync(CS_PATH, csContent);
  fs.writeFileSync(EN_PATH, enContent);

  const keyMatches = [...csContent.matchAll(/^\s+(\w+):/gm)];
  const csKeys = keyMatches.map((m) => m[1]);
  let ukContent = csContent.replace(
    /^import type \{ TranslationKey \} from '\.\/en';/m,
    "import type { TranslationKey } from './en';"
  ).replace(/^export const cs/m, 'export const uk');

  let ukFromCsv = 0;
  let ukFallbackCs = 0;

  for (const key of csKeys) {
    const row = byKey.get(key);
    const ukValue = row?.uk?.trim();
    if (ukValue) {
      ukContent = replaceLocaleKey(ukContent, key, ukValue);
      ukFromCsv += 1;
    } else {
      ukFallbackCs += 1;
    }
  }

  fs.writeFileSync(UK_PATH, ukContent);

  console.log('sync-locales-from-csv done');
  console.log(`  cs patches (web suggested): ${csPatches}`);
  console.log(`  en patches (web suggested): ${enPatches}`);
  console.log(`  uk keys from CSV: ${ukFromCsv}`);
  console.log(`  uk keys fallback CS: ${ukFallbackCs}`);
  console.log(`  written: ${path.relative(ROOT, UK_PATH)}`);
}

main();
