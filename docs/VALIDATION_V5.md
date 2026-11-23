# Rapport de validation — IMAGIE CRÉATION v5

## Vérifications réussies

- `supabase/config.toml` est un TOML valide.
- Tous les chemins de modèles email référencés dans `supabase/config.toml` existent.
- Les 10 modèles HTML email contiennent le lien vers le logo officiel.
- Le logo `site/assets/imagie-logo-original.jpg` et sa copie `site/public/assets/imagie-logo-original.jpg` ont le même SHA-256 que le logo source fourni par le propriétaire : `2b27abdbbf2af8b292315811bed2ed32903c339fc38ba4b0e14acc205297cb70`.
- Les icônes PWA existantes 192×192 et 512×512 ont été conservées.
- `node --check` passe pour `site/assets/app.js` et `site/assets/auth-pages.js`.
- `node site/scripts/validate.mjs` passe : 48 familles de produits, pages, liens CSS/JS, manifests, service worker, logo, parcours OTP et Push contrôlés.
- Le système Push existant garde l'autorisation administrateur côté serveur; les annonces actives et les nouveaux produits déclenchent déjà une notification aux appareils abonnés. Le flux d'édition notifie maintenant aussi les changements de prix, de photo et le réassort d'un produit visible.

## Vérifications non exécutées

Le build Vite complet n'a pas pu être exécuté : l'installation des dépendances npm a dépassé le délai d'exécution disponible. Les tests réels d'envoi d'e-mail, d'OTP, de Push et d'exécution SQL nécessitent votre projet Supabase, un SMTP de production et les clés VAPID.

## À faire dans les comptes hébergés

Le fichier `supabase/config.toml` prépare les réglages pour Supabase CLI/local. Pour le projet Supabase déjà hébergé, il faut aussi copier les modèles HTML dans le Dashboard, activer Confirm email et les notifications de sécurité, régler OTP à 300 secondes, et configurer SMTP. Voir `ACTIVATE_EMAIL_OTP_AND_PUSH.md`.
