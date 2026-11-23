# Passe site web — journal des changements (21 nov. 2026)

Base de travail : `IMAGIE_CREATION_FINAL.zip` (48 familles). **Attention** : le paquet `IMAGIE_CLAUDE_HANDOFF.zip` est arrivé tronqué (3 Mo exactement) ; son code source (décrit avec 53 familles dans le brief) n'a pas pu être lu. Ces changements sont donc faits sur la version à 48 familles. Un patch (`docs/site-pass.patch`) permet de les rejouer sur la version à 53 familles.

## Corrigé / ajouté (tout est testé, voir TEST_REPORT.md)
1. `alert()` des détails produit remplacé par une vraie fiche modale accessible (`assets/product-modal.js`) : role=dialog, aria-modal, focus piégé, Échap, retour du focus, 9 langues pour ses textes. Les variantes sont affichées mais leur choix n'est pas encore enregistré dans le panier/checkout (voir REMAINING_WORK.md).
2. Noms de produits dans la langue active (champ `name_<lang>` puis repli sur `name_fr`) dans les cartes et la recherche.
3. `<html lang>` et `dir` (RTL pour l'arabe) maintenant mis à jour (avant : toujours `fr`/`ltr`).
4. Débordement horizontal à 360 px corrigé (grille « benefit »).
5. Libellés de formulaires réellement associés aux champs (contact, suivi, etc.) + observateur pour les formulaires rendus dynamiquement.
6. Slider d'accueil : démarre en pause si `prefers-reduced-motion`.
7. Page `404.html` (+ entrée Vite), `robots.txt`/`sitemap.xml` générés au build si `SITE_URL` est défini (`scripts/generate-seo.mjs`, hook `prebuild`).
8. `vercel.json` : HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP en mode **Report-Only** (à passer en mode bloquant après test en préproduction avec Turnstile et Supabase réels), `admin.html` en noindex + no-store.
9. Catalogue : source canonique `src/data/catalog-seed.json` + `npm run sync:catalog` / `npm run check:catalog` ; le validateur vérifie les 3 copies identiques et que chaque SKU est dans `seed_catalog.sql`.
10. Edge Function `verify-turnstile` : IP client via `x-forwarded-for` si `cf-connecting-ip` absent ; refus 415 si le corps n'est pas du JSON.
11. Tests E2E navigateur (Playwright/Python) : `tests/e2e/run_visitor_tests.py`.

## Inchangé volontairement
Logo original (hash identique vérifié), schéma SQL, politiques RLS, parcours Imagie Community, prix et statuts de prix, aucune photo ni prix inventé.

## Passe 2 (22 nov. 2026) — comptes, achat invité, installation
12. Pages `connexion`, `inscription`, `mot-de-passe-oublie`, `completer-profil` (module `assets/auth-pages.js`) + migration SQL 002 (âge 18+ côté serveur) — voir `docs/ACCOUNTS_AND_GUEST_PURCHASE.md`.
13. Achat sans compte (commande WhatsApp, panier invité) ; compte réservé aux avantages membres.
14. Correctif : le message d'état Turnstile écrasait le résultat (« lien de vérification envoyé », erreurs) → ligne d'état séparée.
15. Correctif : l'attribut `hidden` était ignoré sur les éléments à `display` défini → règle globale `[hidden]`.
16. PWA : icônes PNG 192/512/maskable (le manifest pointait vers un JPEG non carré), service worker réécrit (l'ancien `cache.addAll` échouait avec les fichiers hachés de Vite), bouton « Installer l'app », `apple-touch-icon`.
17. Pied de page : logo original, © 2026, rangée d'icônes (Facebook, WhatsApp, e-mail ; les autres réseaux apparaissent dès qu'une URL est renseignée).
18. Outil : `tools/build_preview.py` (aperçu mono-fichier pour Artifact).


## Passe 3 (22 nov. 2026) — code e-mail OTP et notifications Push
19. Inscription : après création du compte Supabase Auth, afficher un formulaire de code à 6 chiffres, vérifier avec `verifyOtp(type: signup)`, proposer le renvoi du code et n'activer l'adhésion qu'après validation. Le modèle Confirm signup doit utiliser `{{ .Token }}` et Supabase Confirm email doit être activé.
20. PWA : invitation facultative à activer les notifications navigateur; l'abonnement Push est stocké dans une table isolée par RLS, et le Service Worker affiche les nouveautés. Le visiteur peut refuser.
21. Console propriétaire : les nouveaux produits publiés et les annonces actives appellent une fonction Edge `send-push`, qui revérifie le rôle admin avant d'envoyer les notifications via VAPID.
22. Sécurité : clés VAPID privées et `service_role` uniquement dans Supabase secrets; clé publique VAPID uniquement dans Vercel.
23. Règle commerciale : achat invité désactivé par défaut (`VITE_ALLOW_GUEST_PURCHASE=false`); compte et adhésion restent requis pour les actions membres.

**À configurer chez le propriétaire avant que les services réels fonctionnent :** SMTP + Confirm email + modèle OTP, migration 003, clés VAPID, déploiement `send-push` et variable Vercel `VITE_WEB_PUSH_PUBLIC_KEY`. Le build Vite n'a pas pu être exécuté dans cet environnement car l'installation npm a expiré; les validations statiques et contrôles de syntaxe JS ont réussi.

## Passe 3 (23 nov. 2026) — fusion v5 + correctifs de déploiement
19. Base : v5 (OTP e-mail, Push, e-mails de marque) conservée telle quelle ; patch « fichiers manquants » identique à v5 (aucun conflit).
20. Fusion de la fonction photos par SKU (`public/products/<SKU>.jpg`, `npm run photos`) absente de v5 + 2 photos du propriétaire.
21. Vercel : `vercel.json` forçant preset Vite / sortie dist (site/ et racine) — cause probable du 404 (voir docs/DIAGNOSTIC_VERCEL_404.md).
22. `scripts/check-required-files.mjs` en tête de `prebuild` (liste claire des fichiers manquants sur GitHub) ; build indépendant des dossiers hors `site/`.
23. Versions épinglées (vite ^7, Capacitor ^7, Node >= 20.19).
24. Règle membre obligatoire : `VITE_ALLOW_GUEST_PURCHASE=false` reste la valeur par défaut. Les visiteurs peuvent consulter le catalogue, mais doivent créer un compte et devenir membres pour utiliser le panier et commander.
