# Ce qui reste (état réel)

## Nécessite l'accès réseau (nouvelle conversation ou machine du propriétaire)
- `npm install` → corriger les erreurs éventuelles → **épingler les versions** (Vite, Capacitor sont en `latest`) et committer `package-lock.json` → `npm run build` → vérifier `dist/`.
- Fusionner avec le code source complet (53 familles) puis `npm run sync:catalog`.

## Nécessite les comptes du propriétaire
Supabase (schéma, seed, Auth CAPTCHA, URL de redirection, SMTP), Cloudflare Turnstile, Google/Facebook OAuth, Vercel + domaine, MFA du compte admin. Voir `site/START-HERE.md` et `GID-MIZ-AN-LIY-Imagie.md`.

## À développer (code + tests sur Supabase réel)
- **Variantes v7** : le code de sélection, panier multi-variantes, instantané de commande et mise à jour admin est ajouté avec la migration 004. Il reste à exécuter et tester cette migration sur Supabase/PostgreSQL réel, notamment la concurrence de stock et les policies RLS.
- Traduction complète des textes de pages en pt/de/it/ar/zh (le menu, la fiche produit et plusieurs libellés sont traduits ; beaucoup de textes de pages et le slider restent en français).
- Console admin : gestion de produits, photos, variantes, commandes, devis, clients, statuts de paiement et frais de livraison ajoutée. Restent à développer/tester : gestion avancée des promotions, paramètres commerciaux, audit et MFA obligatoire.
- Paiements : aucune intégration (MonCash/NatCash/international) — à choisir avec les comptes marchands ; rien n'est inventé.
- Limites de débit, alertes, sauvegardes avec test de restauration.
- Textes légaux : à faire valider par le propriétaire (pas un avis juridique).
- CSP : passer de Report-Only à bloquant après test en préproduction.
- Photos et prix confirmés : à fournir par le propriétaire.

## Ajouts (22 nov.)
- Exécuter et tester `migrations/002_account_profile_adult.sql` sur Supabase ; vérifier inscription 18+, OAuth (Google/Facebook/X), confirmation e-mail, SMTP.
- Avantages membres : annonces et produits réservés aux membres (colonne/RLS `members_only`) — à concevoir et tester sur Supabase.
- Confirmation OTP : le code d’inscription est intégré, mais le modèle e-mail `{{ .Token }}`, Confirm email et SMTP doivent être configurés et testés sur le projet Supabase réel.
- Notifications Push : le consentement navigateur, Service Worker, table RLS et fonction Edge admin sont intégrés; migration 003, clés VAPID, déploiement `send-push` et test sur appareil réel restent à faire.
- Commande invitée : désactivée par défaut; le propriétaire a décidé que les actions panier/commande exigent un compte et une adhésion active.
- URL des réseaux sociaux manquants ; publication Vercel + domaine www ; vérifier l'installation Chrome en HTTPS.


## Mise à jour v7 — 23 novembre 2026

Ajouts livrés dans le code : filtres/tri/comparaison, galeries et recommandations, sélection de variantes, panier membre multi-variantes synchronisé, adresse membre, checkout avec snapshots serveur, affichage des détails d’articles en admin, frais de livraison, gestion manuelle des statuts/moyens de paiement, notification Push ciblée des changements de statut.

La migration `supabase/migrations/004_variant_cart_checkout_and_shipping.sql` doit être appliquée après 002 et 003. Déployer aussi `supabase/functions/send-order-update` pour notifications ciblées. Aucun de ces éléments n’est encore validé sur le projet Supabase hébergé. Voir `docs/TEST_REPORT_V7.md`.
