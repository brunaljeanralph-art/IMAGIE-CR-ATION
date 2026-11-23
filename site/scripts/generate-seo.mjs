// Runs before `vite build`. Needs SITE_URL (e.g. https://www.votre-domaine.com), set in Vercel.
// Without SITE_URL: robots.txt is written without a Sitemap line and no sitemap.xml is produced.
import { writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const raw = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
const pages = ['', 'boutique.html', 'metiers.html', 'offres.html', 'a-propos.html', 'contact.html', 'confidentialite.html', 'conditions.html', 'livraison.html'];
let robots = 'User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /compte.html\nDisallow: /suivi.html\nDisallow: /connexion.html\nDisallow: /inscription.html\nDisallow: /mot-de-passe-oublie.html\nDisallow: /completer-profil.html\n';
if (/^https:\/\/[a-z0-9.-]+$/i.test(raw)) {
  robots += `Sitemap: ${raw}/sitemap.xml\n`;
  const urls = pages.map((p) => `  <url><loc>${raw}/${p}</loc></url>`).join('\n');
  await writeFile(resolve(pub, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  console.log(`SEO: sitemap.xml + robots.txt générés pour ${raw}`);
} else {
  await rm(resolve(pub, 'sitemap.xml'), { force: true });
  console.warn('SEO: SITE_URL absent ou invalide (https://... attendu) — pas de sitemap.xml.');
}
await writeFile(resolve(pub, 'robots.txt'), robots);
