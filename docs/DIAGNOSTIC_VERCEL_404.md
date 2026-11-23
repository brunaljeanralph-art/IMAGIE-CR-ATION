# Diagnostic — « 404 NOT_FOUND » sur imagie-cr-ation.vercel.app

## Ce que j'ai constaté
1. Le dépôt GitHub vérifié **n'avait pas** `site/assets/*` (app.js, app.css, auth-pages.js…), `site/.env.example`, les migrations 002/003, la fonction `verify-turnstile` ni les modèles e-mail. Les pages HTML chargent `/assets/app.js` : sans ce fichier, `vite build` échoue → aucun site publié → 404.
2. Piège Vercel : si le preset du projet est **Other** (pas Vite), Vercel publie le dossier `public/` (qui contient seulement images/données, pas `index.html`) → 404 sur `/`.

## Correctifs livrés dans cette version
- `site/vercel.json` **et** `vercel.json` (racine) forcent : framework `vite`, build `npm run build`, sortie `dist` (ou `site/dist`). Plus besoin de régler le preset à la main ; fonctionne avec Root Directory = `site` **ou** racine du dépôt.
- `npm run build` commence par `scripts/check-required-files.mjs` : si un fichier manque sur GitHub, le journal Vercel liste **exactement** lesquels (« site/assets/app.js … ») au lieu d'une erreur Vite obscure.
- Le build ne dépend plus de fichiers hors de `site/` (Root Directory = `site`).
- Versions épinglées : vite ^7, Capacitor ^7, Node >= 20.19.

## Que faire (dans cet ordre)
1. GitHub : ajoutez tous les fichiers de ce zip (dézippé) en gardant les dossiers. Vérifiez que `site/assets/app.js` existe.
2. Vercel → Project → Settings → General : **Root Directory = `site`** (ou laissez la racine : le `vercel.json` racine gère).
3. Settings → Environment Variables : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY`, `VITE_WEB_PUSH_PUBLIC_KEY` (pas de clé secrète !).
4. Deployments → dernier déploiement → **Redeploy**. Ouvrez le journal « Build Logs » : il doit finir par « Fichiers requis présents » puis « built in … ».
5. Si ça échoue encore : copiez les 20 dernières lignes du journal de build et envoyez-les-moi.

## Non vérifié ici
Pas d'accès réseau : `npm install` et `vite build` n'ont pas pu être exécutés dans cette session. La chaîne `prebuild` est testée ; le build Vite lui-même ne l'est pas.
