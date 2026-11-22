# État de livraison — IMAGIE CRÉATION

## Décisions produit confirmées

- IMAGIE CRÉATION est une boutique unique d'impression, de personnalisation et de produits/équipements créatifs.
- Le logo fourni est utilisé à l'identique. Ne pas le retoucher.
- Les visiteurs peuvent parcourir le catalogue. Pour ajouter au panier, enregistrer des favoris, commander, suivre une commande, demander un devis ou utiliser les privilèges, ils doivent créer un compte, confirmer leur e-mail et accepter les conditions de la communauté.
- Le propriétaire dispose d'une console d'administration distincte. Aucun visiteur ne peut s'attribuer le rôle administrateur.
- Le site web et l'application Android partagent Supabase.
- Le prix des produits et les photos restent sous contrôle du propriétaire; les prix provisoires ne peuvent pas être commandés.

## Déjà présent dans les fichiers

- 12 pages HTML indépendantes et un thème responsive.
- Navigation commune, menu mobile, recherche et filtres de catégories.
- Première liste de 48 familles de produits, avec seed SQL.
- Parcours de création de compte, connexion, confirmation d'e-mail, consentement de communauté et récupération de mot de passe.
- Widget Cloudflare Turnstile et transmission du jeton à Supabase Auth pour les formulaires e-mail/mot de passe.
- Fonction Edge de validation Turnstile côté serveur avant le lancement du parcours OAuth Google/Facebook.
- Base SQL avec profils, adhésions, rôles, produits, variantes, paniers membres, commandes, demandes de devis, fichiers clients, annonces membres, RLS et RPC de checkout.
- Première console admin pour produits, commandes, membres, devis et annonces.
- Configuration PWA/Capacitor, invitation de consentement Push, réception des notifications et fonction d’envoi admin VAPID (à configurer côté propriétaire).
- Script de validation statique `cd site && npm run validate`.

## Ne pas considérer comme terminé avant lancement

1. Le propriétaire doit créer son projet Supabase, exécuter `schema.sql`, `seed_catalog.sql`, puis les migrations 002 et 003.
2. Le propriétaire doit créer un widget Cloudflare Turnstile et enregistrer les clés aux bons endroits (Sitekey publique côté navigateur; Secret key dans Supabase uniquement).
3. Configurer Confirm email, modèle OTP `{{ .Token }}`, SMTP de production, domaines et redirections autorisés.
4. Configurer les identifiants OAuth Google et Facebook; exécuter les migrations 002 et 003; tester inscription OTP, connexion, récupération, consentement et Push après ajout des clés VAPID.
5. Créer le compte propriétaire, vérifier son UUID Auth, puis attribuer manuellement `profiles.role = 'admin'`.
6. Compléter toutes les références exactes de la vidéo, les photos originales/licenciées, les variantes réellement vendues, les stocks et les prix définitifs.
7. Finaliser l'interface de sélection des variantes et leur conservation dans le panier et les lignes de commande. Le modèle SQL contient déjà `product_variants` et `order_items.variant_snapshot`, mais l'interface actuelle ne permet pas encore de choisir et commander toutes les variantes.
8. Connecter un prestataire de paiement compatible avec les zones de vente et tester les paiements. Pour le moment, le parcours enregistre la commande et prépare une confirmation WhatsApp; il ne débite aucune carte et n'intègre pas encore MonCash/NatCash.
9. Rédiger et valider les pages légales, les règles de livraison/retour, les délais, frais, taxes et règles de la communauté.
10. Ajouter MFA administrateur, limitations de débit, alertes, audit régulier et sauvegardes testées.
11. Installer les dépendances, exécuter `npm run validate`, `npm run build`, tester avec deux comptes clients et un compte admin; publier ensuite le site.
12. Générer, signer et tester l'APK Android après configuration de Capacitor/Android Studio. Aucun APK signé n'est inclus dans cette archive.

## Limites honnêtes de cette archive

La validation réalisée ici est statique: syntaxe JavaScript, JSON, présence des pages et ressources, intégrité du logo et présence des éléments SQL/JS attendus. Le build Vite n'a pas été exécuté; le SQL n'a pas été appliqué à une base réelle; les flux CAPTCHA/OAuth/paiement n'ont pas été testés avec les comptes du propriétaire; le site n'est pas déployé et l'APK n'est pas compilé/signé.

Cloudflare Turnstile ne garantit pas qu'un compte est une personne honnête et ne rend pas un système inviolable. Il constitue une barrière anti-automatisation; il doit être vérifié côté serveur et complété par les contrôles Auth, RLS, MFA admin, limitation de débit, surveillance et sauvegardes.
