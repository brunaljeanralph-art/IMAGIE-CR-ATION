# IMAGIE CRÉATION — dossier de construction

Ce projet est la base de construction de la boutique et de la communauté IMAGIE CRÉATION. Il sépare clairement **l'espace client** de **la console privée du propriétaire**.

## Règles de marque et de fonctionnement

- Le logo fourni par le propriétaire est conservé tel quel dans `public/assets/imagie-logo-original.jpg` et `site/assets/imagie-logo-original.jpg`. Ne pas le retoucher, recolorer, recadrer ou redessiner.
- Les clients peuvent parcourir le catalogue sans compte. Pour ajouter au panier, enregistrer un favori, passer commande, suivre une commande, envoyer une demande de devis et accéder aux privilèges, ils doivent créer un compte client, confirmer leur adresse e-mail et accepter les conditions de la communauté IMAGIE.
- Les clients ne disposent d'aucun accès à la gestion de l'entreprise. La page `/admin.html` n'est pas liée depuis la navigation publique et vérifie le rôle `admin`; les politiques RLS bloquent aussi les opérations d'administration côté base de données.
- Le rôle administrateur doit être accordé manuellement au compte du propriétaire, après vérification de son identité et de son UUID Supabase. Aucun formulaire public ne permet de devenir administrateur.
- Le site web et l'application Android partageront le même backend Supabase.
- Le logo, les coordonnées et les prix transmis par le propriétaire sont la référence. Les prix restent provisoires tant que le propriétaire ne les a pas confirmés.
- Les photos et textes protégés de Focus Print ou portant un filigrane Shutterstock ne sont pas republiés sans autorisation. Les produits sont représentés par des familles de catalogue à compléter avec les propres photos ou images sous licence d'IMAGIE.

## Contenu de cette livraison

- `site/` — première application web multi-pages avec Vite, interface responsive, navigation, boutique, comptes et communauté, demandes de devis, panye membre, suivi et console administrateur.
- `supabase/schema.sql` — tables, Auth profile trigger, rôles, adhésions, politiques RLS, panier membre, devis, commandes et stockage.
- `supabase/seed_catalog.sql` — 48 familles de produits de départ et options initiales. Ce n'est pas encore la liste exhaustive de chaque référence/SKU des vidéos.
- `supabase/functions/verify-turnstile/` — validation serveur Cloudflare Turnstile pour le parcours OAuth.
- `docs/PROJECT_SPEC.md` — spécification fonctionnelle.
- `docs/IMPLEMENTATION_CHECKLIST.md` — liste de contrôle de validation.
- `docs/BOT_PROTECTION.md` — installation de la protection anti-robot.
- `docs/VIDEO_REFERENCE_MAP.md` — correspondance entre les références vidéo et les parties du site.

## Statut réel

La livraison comprend le code et la configuration de départ, mais **elle n'est pas encore connectée à des comptes externes, hébergée ou publiée**. Pour activer les vrais comptes, les données, le CAPTCHA, les photos administrables et la commande, le propriétaire doit créer/configurer ses propres comptes Supabase et Cloudflare, renseigner les clés publiques de navigateur, exécuter le SQL, déployer la fonction Edge et tester.

L'installation des dépendances et la compilation Vite n'ont pas été confirmées dans cet environnement; les vérifications effectuées ici portent sur la syntaxe JavaScript et les fichiers JSON. Aucun APK signé ni paiement réel n'est inclus.

## Coordonnées fournies

- Carrefour, Haïti
- WhatsApp principal : +509 40 43 7940
- Numéros secondaires : +509 36 94 2951 et +509 35 61 1326
- E-mail : dieudonnejuillet473@gmail.com
- Facebook : https://www.facebook.com/profile.php?id=61558712566102

Confirmer les coordonnées et la disponibilité WhatsApp de chaque numéro avant lancement public.

## Parcours des clients

1. Le visiteur consulte les pages publiques et le catalogue.
2. Pour ajouter au panier, sauvegarder des favoris, envoyer une demande de devis ou commander, il crée un compte ou se connecte.
3. L'inscription e-mail demande une vérification de l'adresse. Après connexion, le client confirme l'adhésion gratuite à Imagie Community et accepte les conditions.
4. Un numéro de membre est créé automatiquement. Le membre peut conserver son panier, consulter ses propres commandes, devis, favoris et actualités membres.
5. Les prix et le stock sont revalidés dans la base avant l'enregistrement d'une commande. La commande est enregistrée et un récapitulatif WhatsApp peut être ouvert pour confirmer livraison/paiement.

Les privilèges promotionnels doivent être configurés par le propriétaire. Les points affichés sont préparés pour un futur programme, mais aucun programme de récompenses avec valeur monétaire n'est actif tant que ses règles ne sont pas définies.

## Parcours du propriétaire

- Se connecter avec le compte propriétaire.
- Accéder directement à `/admin.html` (aucun lien public n'est affiché).
- Le code vérifie `profiles.role = 'admin'`; les mêmes contrôles sont imposés par RLS sur les tables.
- La console de départ peut gérer les produits essentiels (ajout, photo, prix, stock, visibilité), les statuts de commandes, les membres, les demandes de devis et les actualités membres.
- La gestion complète des variantes, paiements, promotions, retours, contenu multi-langue et journaux d'audit reste à compléter avant le lancement commercial.

## Démarrage

Consulter `site/START-HERE.md`. Ne jamais envoyer de mot de passe, secret Cloudflare, clé `service_role` ou clé privée dans une conversation ou dans le code frontend.


## Mise à jour v7 — panier, variantes et adresses

Après `schema.sql`, `seed_catalog.sql`, puis les migrations 002 et 003, exécutez aussi `supabase/migrations/004_variant_cart_checkout_and_shipping.sql` dans Supabase SQL Editor. Cette migration ajoute la sélection des variantes au panier et au checkout, conserve un instantané des options dans la commande et permet d'associer une adresse enregistrée.


## Livraison boutique v7

La version v7 ajoute le filtrage/tri du catalogue, la comparaison de produits, les galeries, les variantes persistées dans le panier et l’historique de commande, les adresses membres, les frais de livraison et les statuts de paiement administrables. Appliquer `supabase/migrations/004_variant_cart_checkout_and_shipping.sql`. Déployer `supabase/functions/send-order-update` pour notifier uniquement le client concerné lors d’un changement d’état de sa commande. Les paiements MonCash/NatCash restent une validation manuelle dans l’admin : aucune passerelle automatique n’est incluse.
