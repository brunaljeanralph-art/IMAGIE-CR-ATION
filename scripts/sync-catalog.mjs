// Single source of truth: ../src/data/catalog-seed.json
// `npm run sync:catalog`   -> copies it to site/data and site/public/data
// `npm run check:catalog`  -> fails if the three copies differ
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = resolve(site, '../src/data/catalog-seed.json');
const targets = [resolve(site, 'data/catalog.json'), resolve(site, 'public/data/catalog.json')];
const check = process.argv.includes('--check');

const source = await readFile(canonical, 'utf8');
const parsed = JSON.parse(source);
const skus = parsed.products.map((p) => p.sku);
const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
if (dupes.length) { console.error(`SKU dupliqués: ${[...new Set(dupes)].join(', ')}`); process.exit(1); }

let bad = 0;
for (const target of targets) {
  let current = null;
  try { current = await readFile(target, 'utf8'); } catch { /* missing */ }
  if (current === source) continue;
  if (check) { console.error(`DIFFÉRENT: ${target}`); bad++; continue; }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, source);
  console.log(`Synchronisé: ${target}`);
}
if (bad) { console.error('Exécutez: npm run sync:catalog'); process.exit(1); }
console.log(`Catalogue cohérent: ${parsed.products.length} familles, ${targets.length + 1} fichiers identiques.`);
