#!/usr/bin/env node
/**
 * Synchronizuje constants/branchesGallery.ts podle souborů v assets/img/gallery/.
 * Spusť po přidání nových fotek: npm run sync:gallery
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const galleryDir = path.join(root, 'assets/img/gallery');
const outFile = path.join(root, 'constants/branchesGallery.ts');

const IMAGE_EXT = new Set(['.webp', '.jpg', '.jpeg', '.png']);

if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

const files = fs
  .readdirSync(galleryDir)
  .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'cs'))
  .reverse();

const items = files.map((file, index) => {
  const id = String(index + 1).padStart(2, '0');
  return `  {
    id: '${id}',
    source: require('@/assets/img/gallery/${file}'),
  }`;
});

const content = `/** Auto-generated — npm run sync:gallery po přidání fotek do assets/img/gallery/ */
export const BRANCHES_GALLERY_ITEMS = [
${items.length > 0 ? items.join(',\n') : '  // Přidej .webp / .jpg do assets/img/gallery/ a spusť npm run sync:gallery'}
] as const;

export const BRANCHES_GALLERY_CARD = {
  width: 160,
  height: 220,
} as const;
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log(`branchesGallery: ${files.length} image(s) → ${path.relative(root, outFile)}`);
files.forEach((f) => console.log(`  - ${f}`));
