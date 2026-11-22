import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const pages=['index','boutique','metiers','offres','a-propos','suivi','compte','contact','confidentialite','conditions','livraison','admin','404','connexion','inscription','mot-de-passe-oublie','completer-profil'];
export default defineConfig({
  root: rootDir,
  publicDir: resolve(rootDir, 'public'),
  build: { rollupOptions: { input: Object.fromEntries(pages.map(p=>[p,resolve(rootDir,`${p}.html`)])) } }
});
