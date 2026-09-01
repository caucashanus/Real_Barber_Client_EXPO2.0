#!/usr/bin/env node
/**
 * Copies flow-snapshot.json from seo-starter develop into the native app.
 *
 * Source (default): ../seo-starter-2/vendor/rbicek-widget/dist/flow-snapshot.json
 *
 * Usage:
 *   npm run sync:rbicek-flow
 *   node scripts/sync-rbicek-flow.mjs /path/to/flow-snapshot.json
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const defaultSource = join(
  repoRoot,
  '../seo-starter-2/vendor/rbicek-widget/dist/flow-snapshot.json'
);
const target = join(repoRoot, 'lib/rbicek/flow/flow-snapshot.json');

const source = resolve(process.argv[2] ?? defaultSource);

if (!existsSync(source)) {
  console.error(`Source snapshot not found: ${source}`);
  process.exit(1);
}

copyFileSync(source, target);

const snapshot = JSON.parse(readFileSync(target, 'utf8'));
console.log(
  `Synced flow-snapshot.json → lib/rbicek/flow/flow-snapshot.json\n` +
    `  version: ${snapshot.version}\n` +
    `  generatedAt: ${snapshot.generatedAt}\n` +
    `  nodes: ${snapshot.nodes?.length ?? 0}`
);
