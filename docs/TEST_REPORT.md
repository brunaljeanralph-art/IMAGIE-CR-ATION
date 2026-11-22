# Rapport de tests — 21 novembre 2026

## Ce qui a été exécuté (résultats réels)
| Test | Résultat |
|---|---|
| `node scripts/validate.mjs` (12 pages + 404, JSON, catalogue canonique, SKU vs seed SQL, hash du logo, marqueurs sécurité) | RÉUSSI |
| `node --check` sur `app.js`, `product-modal.js`, `validate.mjs` | RÉUSSI |
| E2E navigateur (Chromium, Supabase simulé = non configuré) : `python3 tests/e2e/run_visitor_tests.py` | **57/57 réussis** |

Couverture E2E : rendu sans erreur JS des 13 pages ; admin.html sans données pour un visiteur + noindex ; liens de menu vers des pages indépendantes ; drawer mobile fermé après clic ; bouton Précédent ; 48 produits ; recherche ; produits à prix non confirmé non commandables ; fiche produit (dialog, focus, piège, Échap) ; aucune `alert()` ; langues fr/ht/en/es/pt/de/it/zh/ar (`html[lang]`, RTL arabe) ; absence de débordement horizontal à 360/390/768/1024/1440 px ; reduced-motion ; slider auto + pause ; CSP appliquée (mode bloquant) sans violation sur les pages publiques ; libellés de formulaires ; alt des images.

Défauts trouvés par ces tests puis corrigés : `<html lang>` jamais mis à jour, pas de RTL, débordement à 360 px, champs de formulaire sans libellé associé.

## Ce qui N'A PAS pu être testé (honnêteté)
- `npm install` et `npm run build` (Vite) : pas d'accès réseau dans la session. Aucun build n'est prouvé.
- Parcours connectés (inscription, confirmation e-mail, consentement, panier synchronisé, checkout, suivi, devis, upload) : nécessitent Supabase réel.
- Politiques RLS et grants (client A / client B / admin), fonction `create_order_from_cart` (stock, prix, concurrence) : nécessitent PostgreSQL/Supabase ; aucun moteur SQL disponible ici.
- Turnstile réel, Edge Function déployée, OAuth Google/Facebook, MFA admin, limites de débit, sauvegardes.
- Admin CRUD réel.

## Mise à jour 22 nov. 2026
| Test | Résultat |
|---|---|
| `tests/e2e/run_visitor_tests.py` (visiteur, PWA, install, CSP) | **62/62** |
| `tests/e2e/run_account_tests.py` (comptes avec Supabase simulé : validation 18+, payloads signUp/signIn/OAuth/reset, redirections, Turnstile simulé) | **62/62** |
| `node site/scripts/validate.mjs` (inclut manifest/icônes/service worker/copies) | RÉUSSI |
| Aperçu Artifact (`tools/build_preview.py`) : 17 routes, pages de compte, pied de page, 360 px | 25/25 |
Défauts réels trouvés puis corrigés : message Turnstile qui écrasait les résultats ; attribut `hidden` sans effet ; manifest sans icônes PNG ; service worker incompatible avec le build Vite.
Toujours NON testé : Supabase/Postgres réels (migration 002 incluse), OAuth, Turnstile réel, `npm run build`.


## Passe OTP + Push (22 nov. 2026)
| Vérification | Résultat |
|---|---|
| `node --check site/assets/app.js` | RÉUSSI |
| `node --check site/assets/auth-pages.js` | RÉUSSI |
| `node --check site/service-worker.js` et copie `public/service-worker.js` | RÉUSSI |
| `node site/scripts/validate.mjs` (OTP, RLS Push, réception Push, contrôle admin, achat invité désactivé) | RÉUSSI |
| `npm install` / `npm run build` | NON EXÉCUTÉ : installation npm a expiré |
| Tests Playwright en navigateur | NON EXÉCUTÉS : Chromium Playwright requis absent; Chromium système refuse les requêtes locales (`ERR_BLOCKED_BY_ADMINISTRATOR`) |
| SMTP/OTP, Postgres, Edge Function, Push sur vrai appareil | À CONFIGURER / TESTER avec les comptes du propriétaire |
