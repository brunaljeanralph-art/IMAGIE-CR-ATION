# Ce qui reste (état réel)

## Nécessite l'accès réseau (nouvelle conversation ou machine du propriétaire)
- `npm install` → corriger les erreurs éventuelles → **épingler les versions** (Vite, Capacitor sont en `latest`) et committer `package-lock.json` → `npm run build` → vérifier `dist/`.
- Fusionner avec le code source complet (53 familles) puis `npm run sync:catalog`.

## Nécessite les comptes du propriétaire
Supabase (schéma, seed, Auth CAPTCHA, URL de redirection, SMTP), Cloudflare Turnstile, Google/Facebook OAuth, Vercel + domaine, MFA du compte admin. Voir `site/START-HERE.md` et `GID-MIZ-AN-LIY-Imagie.md`.

## À développer (code + tests sur Supabase réel)
- **Variantes** : stocker le choix dans `customer_cart_items`, le recalculer et le figer (`variant_snapshot`) dans `create_order_from_cart`. Migration SQL + tests Postgres nécessaires.
- Traduction complète des textes de pages en pt/de/it/ar/zh (le menu, la fiche produit et plusieurs libellés sont traduits ; beaucoup de textes de pages et le slider restent en français).
- Console admin : vérifier/terminer CRUD, variantes, promotions, paramètres, audit, MFA obligatoire.
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
