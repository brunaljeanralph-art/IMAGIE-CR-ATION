# IMAGIE CRÉATION — améliorations v7 boutique

Cette version conserve la structure HTML/CSS/JS, Supabase, PWA et l'identité visuelle existantes. Les ajouts sont incrémentaux.

## Boutique
- Recherche, catégories, tri par mise en avant/date/prix/nom, disponibilité et fourchette de prix.
- Comparaison jusqu'à trois produits, conservée localement sur l'appareil.
- Fiche produit avec galerie, sélection de variantes et recommandations connexes.
- Panier avec lignes distinctes par variante; cache local et synchronisation membre Supabase.
- Adresses client enregistrées et sélection facultative au checkout.

## Commandes et administration
- Migration SQL 004 : variante validée côté serveur, instantané des options et adresse enregistrée dans la commande.
- Console propriétaire : gestion des variantes, détails des articles et adresse, état de commande, frais de livraison, moyen/statut de paiement.
- Le statut « Payé » reste une confirmation manuelle après vérification réelle du paiement. Aucun paiement automatique MonCash/NatCash/carte n'est simulé.

## Limites de publication
- Les prix du catalogue restent inchangés. Un produit sans prix `active` n'est pas commandable.
- Les frais de livraison doivent être confirmés puis saisis par le propriétaire; le checkout présente d'abord un sous-total hors livraison.
- Les variables Supabase/Turnstile/VAPID et les politiques/redirects doivent être configurés dans les services concernés.
- Exécuter migration 004 avant de tester les variantes et les adresses sur Supabase.

- Notification Push ciblée du client concerné lors des changements d’état de sa commande (déployer `send-order-update`).
- Prix des variantes relus depuis le catalogue courant dans le panier; quantités contrôlées côté interface et revérifiées par SQL au checkout.
- Ouverture WhatsApp préparée de façon compatible avec les bloqueurs de fenêtres après le checkout.
