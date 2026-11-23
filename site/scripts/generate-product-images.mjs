// Photos par SKU : déposez public/products/<SKU>.jpg (ou .webp/.png). Ce script (lancé avant chaque build)
// génère public/products/index.json et docs/PHOTOS_PAR_SKU.md. Aucun fichier inconnu n'est ignoré en silence.
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(site, 'public/products');
// Reads the copy INSIDE site/ so the build works even when Vercel's Root Directory is `site`.
const catalog = JSON.parse(await readFile(resolve(site, 'data/catalog.json'), 'utf8')).products;
const skus = new Map(catalog.map((p) => [p.sku.toLowerCase(), p]));
const ok = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const map = {}; const problems = [];
for (const f of (await readdir(dir)).sort()) {
  if (f === 'index.json' || f.startsWith('.')) continue;
  const ext = extname(f).toLowerCase(); const base = basename(f, extname(f));
  const p = skus.get(base.toLowerCase());
  if (!ok.has(ext)) { problems.push(`${f}: format non pris en charge (jpg, png, webp)`); continue; }
  if (!p) { problems.push(`${f}: aucun produit avec ce SKU (vérifiez l'orthographe exacte)`); continue; }
  const size = (await stat(resolve(dir, f))).size;
  if (size > 1_500_000) problems.push(`${f}: ${(size / 1e6).toFixed(1)} Mo — réduisez sous 1,5 Mo pour un site rapide`);
  map[p.sku] = `/products/${f}`;
}
await writeFile(resolve(dir, 'index.json'), JSON.stringify(map, null, 2) + '\n');
const rows = catalog.map((p) => `| \`${p.sku}\` | ${p.name_fr} | ${map[p.sku] ? '✅ ' + map[p.sku].split('/').pop() : '—'} |`).join('\n');
try { await writeFile(resolve(site, '../docs/PHOTOS_PAR_SKU.md'), `# Photos par produit (généré — ne pas modifier à la main)\n\nNom du fichier = SKU exact + extension, dans \`site/public/products/\`. Exemple : \`IM-TU-40-HANDLE.jpg\`.\n\n${Object.keys(map).length} / ${catalog.length} produits ont une photo.\n\n| SKU (nom du fichier) | Produit | Photo |\n|---|---|---|\n${rows}\n`); } catch { /* docs/ absent (Root Directory = site): not needed for the build */ }
console.log(`Photos: ${Object.keys(map).length}/${catalog.length} produits avec photo.`);
for (const p of problems) console.warn('ATTENTION ' + p);
if (process.argv.includes('--strict') && problems.length) process.exit(1);
