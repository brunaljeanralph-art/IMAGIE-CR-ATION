import { readFile, access } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const ok = (message) => console.log(`OK  ${message}`);
const fail = (message) => problems.push(message);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

const files = await walk(root);
for (const file of files.filter((f) => f.endsWith('.json') || f.endsWith('.webmanifest'))) {
  try { JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { fail(`JSON invalide: ${file} (${error.message})`); }
}
if (!problems.length) ok('Fichiers JSON et manifests valides');

const pages = files.filter((f) => f.endsWith('.html'));
if (pages.length !== 17) fail(`17 pages HTML attendues (12 pages + 404 + 4 pages de compte), ${pages.length} trouvées`);
else ok('12 pages HTML + 404.html + 4 pages de compte présentes');

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  if (!html.includes('/assets/app.css') || !html.includes('/assets/app.js')) {
    fail(`Chargement CSS/JS absent: ${basename(page)}`);
  }
}
if (!problems.some((p) => p.includes('Chargement CSS/JS'))) ok('Toutes les pages chargent le CSS et JavaScript communs');

const catalogPath = resolve(root, 'data/catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
if (!Array.isArray(catalog.products) || catalog.products.length < 40) fail('Catalogue de départ incomplet (minimum 40 familles attendu)');
else ok(`Catalogue local: ${catalog.products.length} familles de produits`);

const repoRoot = resolve(root, '..');
{
  const manifest = JSON.parse(await readFile(resolve(root, 'public/manifest.webmanifest'), 'utf8'));
  let bad = [];
  for (const icon of manifest.icons || []) {
    try {
      const b = await readFile(resolve(root, 'public' + icon.src));
      const isPng = b.length > 24 && b.readUInt32BE(0) === 0x89504e47;
      const [w, h] = icon.sizes.split('x').map(Number);
      if (!isPng || b.readUInt32BE(16) !== w || b.readUInt32BE(20) !== h) bad.push(icon.src);
    } catch { bad.push(icon.src + ' (absent)'); }
  }
  const sizes = (manifest.icons || []).map((i) => i.sizes);
  if (bad.length) fail(`Icônes du manifest invalides: ${bad.join(', ')}`);
  else if (!sizes.includes('192x192') || !sizes.includes('512x512')) fail('Manifest: icônes 192 et 512 px requises pour l’installation');
  else ok('PWA: manifest + icônes PNG 192/512 valides (installable sur Chrome)');
  for (const f of ['manifest.webmanifest', 'service-worker.js', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-512-maskable.png']) {
    const a = await readFile(resolve(root, f)), b = await readFile(resolve(root, 'public', f));
    if (!a.equals(b)) fail(`Copie différente entre site/ et site/public/: ${f}`);
  }
  const sw = await readFile(resolve(root, 'public/service-worker.js'), 'utf8');
  if (/cache\.addAll\(/.test(sw)) fail('Service worker: cache.addAll est fragile avec des fichiers Vite hachés'); else ok('Service worker tolérant aux fichiers hachés');
}
{ try { const m = await readFile(resolve(repoRoot, 'supabase/migrations/002_account_profile_adult.sql'), 'utf8'); if (/complete_member_profile/.test(m) && /ADULT_REQUIRED/.test(m)) ok('Migration 002 (profil, majorité 18 ans) présente'); else fail('Migration 002 incomplète'); } catch { fail('supabase/migrations/002_account_profile_adult.sql manquant'); } }
{
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
  const canon = await readFile(resolve(repoRoot, 'src/data/catalog-seed.json'));
  const copies = ['data/catalog.json', 'public/data/catalog.json'];
  let same = true;
  for (const c of copies) if (sha(await readFile(resolve(root, c))) !== sha(canon)) { same = false; fail(`Catalogue différent de la source canonique: ${c} (npm run sync:catalog)`); }
  if (same) ok('Catalogue: source canonique et 2 copies identiques');
  const seed = await readFile(resolve(repoRoot, 'supabase/seed_catalog.sql'), 'utf8');
  const missing = JSON.parse(canon.toString('utf8')).products.map((p) => p.sku).filter((s) => !seed.includes(`'${s}'`));
  if (missing.length) fail(`SKU absents du seed SQL: ${missing.join(', ')}`); else ok('Catalogue: tous les SKU sont présents dans seed_catalog.sql');
}
const logoA = await readFile(resolve(root, 'assets/imagie-logo-original.jpg'));
const logoB = await readFile(resolve(repoRoot, 'public/assets/imagie-logo-original.jpg'));
const hashA = crypto.createHash('sha256').update(logoA).digest('hex');
const hashB = crypto.createHash('sha256').update(logoB).digest('hex');
if (hashA !== hashB) fail('Les copies du logo original ne sont pas identiques');
else ok('Logo original identique dans public/ et site/ (aucune modification)');

const js = await readFile(resolve(root, 'assets/app.js'), 'utf8');
for (const marker of ['requireMember(', 'accept_community_terms', 'verify-turnstile', 'create_order_from_cart']) {
  if (!js.includes(marker)) fail(`Fonction client attendue absente: ${marker}`);
}
const schema = await readFile(resolve(repoRoot, 'supabase/schema.sql'), 'utf8');
for (const marker of ['create_order_from_cart', 'customer_memberships', 'community_terms_accepted_at', 'public.is_admin()', 'enable row level security']) {
  if (!schema.includes(marker)) fail(`Élément SQL attendu absent: ${marker}`);
}
if (!problems.some((p) => p.includes('Fonction client')) && !problems.some((p) => p.includes('Élément SQL'))) ok('Marqueurs essentiels du parcours membre, checkout et sécurité présents');

if (problems.length) {
  console.error('\nVALIDATION ÉCHOUÉE');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log('\nVALIDATION STATIQUE RÉUSSIE. Cela ne remplace pas un build Vite, une exécution SQL ni des tests sur Supabase/Cloudflare.');

// Email OTP and opt-in browser Push notification checks.
{
  const auth = await readFile(resolve(root, 'assets/auth-pages.js'), 'utf8');
  if (/auth\.verifyOtp\(\{\s*email:\s*otpEmail,\s*token,\s*type:\s*'signup'/.test(auth) && /auth\.resend\(\{\s*type:\s*'signup'/.test(auth)) ok('Inscription: validation OTP et renvoi de code présents');
  else fail('Inscription: le parcours de validation OTP est incomplet');
  const app = await readFile(resolve(root, 'assets/app.js'), 'utf8');
  for (const marker of ['VITE_WEB_PUSH_PUBLIC_KEY', 'pushManager.subscribe', "functions.invoke('send-push'", 'push-consent']) {
    if (!app.includes(marker)) fail(`Notifications Push: marqueur absent ${marker}`);
  }
  const migrationPath = resolve(repoRoot, 'supabase/migrations/003_email_otp_and_push_notifications.sql');
  const migration = await readFile(migrationPath, 'utf8');
  if (/create table if not exists public\.push_subscriptions/i.test(migration) && /enable row level security/i.test(migration) && /for insert to anon, authenticated/i.test(migration)) ok('Notifications: table de souscriptions avec RLS présente');
  else fail('Notifications: migration SQL incomplète');
  const worker = await readFile(resolve(root, 'public/service-worker.js'), 'utf8');
  if (/addEventListener\('push'/.test(worker) && /showNotification/.test(worker) && /notificationclick/.test(worker)) ok('PWA: réception et ouverture des notifications Push présentes');
  else fail('PWA: événements Push incomplets');
  const edge = await readFile(resolve(repoRoot, 'supabase/functions/send-push/index.ts'), 'utf8');
  if (/is_admin/.test(edge) && /VAPID_PRIVATE_KEY/.test(edge) && /sendNotification/.test(edge)) ok('Push: fonction serveur protégée par le rôle administrateur');
  else fail('Push: fonction serveur ou contrôle administrateur incomplet');
  const envExample = await readFile(resolve(root, '.env.example'), 'utf8');
  if (!/VITE_ALLOW_GUEST_PURCHASE=true/.test(envExample) && /VITE_ALLOW_GUEST_PURCHASE=false/.test(envExample)) ok('Commande invitée désactivée par défaut');
  else fail('VITE_ALLOW_GUEST_PURCHASE doit être désactivé par défaut');
}
