# Imagie Création — de zéro à en ligne (GitHub + Vercel + Supabase)

1. **GitHub** : créez un dépôt (privé) et déposez TOUT le contenu de ce dossier (depuis un ordinateur : glissez le dossier dézippé). Ne jamais déposer `.env.local`.
2. **Supabase** → SQL Editor : `supabase/schema.sql`, puis `supabase/seed_catalog.sql`, puis `supabase/migrations/002_account_profile_adult.sql`, puis `supabase/migrations/003_email_otp_and_push_notifications.sql`, puis `supabase/migrations/004_variant_cart_checkout_and_shipping.sql`.
3. **Vercel** → Import du dépôt → **Root Directory = `site`** → Framework Vite → variables : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY`, `VITE_WEB_PUSH_PUBLIC_KEY` (+ `SITE_URL=https://www.votre-domaine.com`, `VITE_ALLOW_GUEST_PURCHASE=false`).
4. Suivez `docs/ACTIVATE_EMAIL_OTP_AND_PUSH.md` ainsi que `docs/ACCOUNTS_AND_GUEST_PURCHASE.md` (URL de redirection, fournisseurs Google/Facebook/X, Turnstile, SMTP) et `site/START-HERE.md`.
5. Après un premier `npm install` réussi : épinglez les versions « latest » de `package.json` et commitez `package-lock.json`.
6. Tests : `node site/scripts/validate.mjs` ; navigateur : `python3 tests/e2e/run_visitor_tests.py` et `run_account_tests.py` (Playwright).

## En cas de « 404 NOT_FOUND » sur Vercel
Lisez `docs/DIAGNOSTIC_VERCEL_404.md`. Cause la plus fréquente : fichiers manquants sur GitHub (upload depuis le téléphone). Le build affiche maintenant la liste exacte des fichiers manquants.


## Livraison boutique v7

La version v7 ajoute le filtrage/tri du catalogue, la comparaison de produits, les galeries, les variantes persistées dans le panier et l’historique de commande, les adresses membres, les frais de livraison et les statuts de paiement administrables. Appliquer `supabase/migrations/004_variant_cart_checkout_and_shipping.sql`. Déployer `supabase/functions/send-order-update` pour notifier uniquement le client concerné lors d’un changement d’état de sa commande. Les paiements MonCash/NatCash restent une validation manuelle dans l’admin : aucune passerelle automatique n’est incluse.
