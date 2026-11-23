// Runs first in `npm run build`. A phone upload to GitHub can silently skip files; this makes the
// Vercel build log say EXACTLY which files are missing instead of a confusing Vite error.
import { access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index','boutique','metiers','offres','a-propos','suivi','compte','contact','confidentialite','conditions','livraison','admin','404','connexion','inscription','mot-de-passe-oublie','completer-profil'].map((p) => `${p}.html`);
const required = [...pages, 'vite.config.js', 'package.json', 'vercel.json',
  'assets/app.js', 'assets/app.css', 'assets/auth-pages.js', 'assets/product-modal.js', 'assets/supabase-client.js',
  'assets/imagie-logo-original.jpg', 'assets/icon-192.png', 'assets/icon-512.png',
  'data/catalog.json', 'public/data/catalog.json', 'public/manifest.webmanifest', 'public/service-worker.js',
  'public/assets/imagie-logo-original.jpg', 'public/assets/icon-192.png', 'public/assets/icon-512.png', 'public/products/index.json'];
const missing = [];
for (const f of required) { try { await access(resolve(root, f)); } catch { missing.push(f); } }
if (missing.length) {
  console.error('\nERREUR — fichiers manquants dans GitHub (dans le dossier site/) :');
  for (const f of missing) console.error('  - site/' + f);
  console.error('\nRe-téléversez ces fichiers sur GitHub en gardant les mêmes dossiers, puis Vercel > Redeploy.');
  console.error('Fichye sa yo manke sou GitHub. Remete yo menm kote yo ye a, epi fè Redeploy sou Vercel.\n');
  process.exit(1);
}
console.log(`Fichiers requis présents (${required.length}).`);
