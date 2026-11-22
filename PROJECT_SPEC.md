# Cahier de référence — IMAGIE CRÉATION

## 1. Vision du produit

IMAGIE CRÉATION est une entreprise de création, personnalisation, impression et vente de produits et équipements. Le produit numérique doit comprendre :

1. un site e-commerce responsive;
2. une application Android (APK) qui réutilise les mêmes services et données que le site;
3. un espace client avec authentification réelle;
4. un espace d'administration privé;
5. un catalogue administrable avec produits, variantes, photos, prix, stocks et catégories;
6. un traitement des commandes, demandes de devis, paiements et suivi;
7. un parcours multilingue.

Le modèle retenu est une boutique à marque unique (single store), pas une place de marché multi-vendeurs. Les fournisseurs peuvent être gérés dans l'administration comme sources d'approvisionnement, mais ils ne créent pas leurs propres boutiques.

## 2. Identité visuelle et règles de marque

- Employer exclusivement le logo original fourni, sans retouche, redessin, recoloration, recadrage ni changement de proportions.
- Construire l'interface autour de l'identité du logo : bleu marine, orange, rouge, jaune, vert et turquoise.
- S'inspirer de la présentation sombre bleu marine/orange observée dans la vidéo IMAGIE, mais améliorer la hiérarchie, les espacements, le contraste, les cartes et la lisibilité.
- Prévoir un thème clair et un thème sombre si cela peut être fait sans nuire à la cohérence.
- Animations attendues : slider automatique avec points de navigation et pause, transitions de pages, apparitions discrètes des sections, survols légers des cartes, feedback des boutons, tiroir de menu mobile, animation du panier. Respecter `prefers-reduced-motion`.
- Le rendu doit être excellent sur mobile, tablette et ordinateur. Les pages ont chacune leur propre URL; le menu ne doit pas simplement faire défiler vers une ancre de la même page.

## 3. Structure des pages

### Accueil (`/`)
- En-tête avec logo original, sélecteur de langue, accès au compte, panier et menu.
- Slider de mise en avant (équipements, bannières, impressions, créations ou offres), boutons d'action et possibilité de pause.
- Message d'accueil : « Vos idées, en couleurs » / équivalent traduit.
- Accès rapide à la boutique et aux demandes par WhatsApp.
- Produits populaires, nouveautés, catégories et promotions.
- Aperçu de Nos métiers, arguments de confiance, témoignages (uniquement lorsque de vrais avis sont disponibles), aperçu des demandes de devis et pied de page complet.

### Boutique (`/boutique`)
- Recherche par nom, code produit et description.
- Filtres par catégories, sous-catégories, prix, disponibilité et attributs.
- Tri par pertinence, nouveauté, prix et popularité.
- Cartes produits avec photo autorisée, nom, code, prix, disponibilité et bouton d'ajout.
- Fiche détaillée avec galerie, variantes (couleur, format, taille, capacité, modèle de téléphone), quantité, description, instructions de personnalisation et disponibilité.
- Panier persistant, modification des quantités, suppression, sous-total, frais clairement indiqués et total.
- Les prix peuvent être changés depuis l'administration; aucun tarif du site de référence ne doit être considéré comme tarif d'IMAGIE.

### Nos métiers (`/metiers`)
- Sublimation.
- Impression DTF et UV DTF.
- Stickers et vinyle.
- Bannières, bâches, roll-up, X-banner et impression grand format.
- Broderie personnalisée.
- Création graphique, logos et personnalisation.
- Équipements et consommables.
- Chaque service dispose d'une explication originale, d'exemples visuels autorisés et d'un formulaire « Demander un devis » (type de projet, quantité, dimensions, délai, fichier joint, coordonnées).

### Offres (`/offres`)
- Promotions configurables depuis l'administration.
- Prix barré uniquement si le prix de référence est réel et vérifiable.
- Bons de réduction et conditions d'application clairement affichées.
- Ne pas afficher de promotions fictives.

### À propos (`/a-propos`)
- Présentation d'IMAGIE CRÉATION, sa mission, ses valeurs, son approche de la personnalisation et les raisons de la choisir.
- Ne pas reprendre l'histoire, les dates, le NIF, l'adresse ni les textes de Focus Print.
- Ajouter la touche personnelle demandée par le propriétaire, avec son accord sur le texte final.

### Suivre ma commande (`/suivi`)
- Recherche par numéro de commande et vérification supplémentaire (téléphone ou lien/OTP sécurisé).
- États possibles : reçue, en attente de confirmation, paiement en attente, confirmée, en préparation, en production, expédiée, prête à retirer, livrée, annulée ou remboursée.
- Un client ne doit jamais pouvoir consulter la commande d'une autre personne en devinant un numéro.
- Prévoir notification par e-mail/WhatsApp lorsque les intégrations sont configurées.

### Mon compte (`/compte`)
- Création de compte et connexion par e-mail.
- Connexion Google et Facebook lorsque les identifiants OAuth du propriétaire sont configurés.
- Vérification d'adresse e-mail, réinitialisation sécurisée du mot de passe et déconnexion des sessions.
- Profil, téléphone, adresses, préférences de langue, historique et détail des commandes, demandes de devis.
- Ne pas présenter des boutons OAuth comme fonctionnels tant qu'ils ne sont pas configurés et testés.
- Le profil local sur l'appareil peut servir de préférence temporaire, mais ne doit pas être présenté comme un vrai compte synchronisé.

### Contact (`/contact`)
- Formulaire : nom, e-mail, téléphone, sujet et message.
- Actions WhatsApp et appel téléphonique.
- Coordonnées IMAGIE fournies dans le README, à revérifier avant publication.
- Lien vers la page Facebook fournie.
- Localisation indiquée : Carrefour, Haïti.

### Administration (`/admin`)
- Zone non indexée publiquement, accessible uniquement à un rôle administrateur vérifié côté serveur.
- Tableau de bord : commandes récentes, ventes, demandes de devis, produits à faible stock et indicateurs.
- Gestion CRUD des produits, catégories, variantes, photos, prix, stocks, promotions, clients, commandes, états, frais de livraison, contenus, langues et paramètres.
- Journal d'audit des actions sensibles.
- Authentification forte et contrôle d'accès côté serveur; masquer un lien dans le menu n'est pas une mesure de sécurité.

## 4. Panier, commande et paiement

- Le panier accepte plusieurs articles et variantes.
- Avant validation, montrer le récapitulatif complet, la devise, les frais, les réductions et le total.
- Les commandes sont enregistrées par la fonction PostgreSQL `create_order_from_cart` (SECURITY DEFINER), qui recalcule les montants et contrôle les prix, l'adhésion et le stock; un numéro unique est retourné.
- L'option WhatsApp prépare un message récapitulatif après l'enregistrement réel de la commande; elle ne remplace pas le paiement ni la confirmation commerciale.
- Prévoir des méthodes de paiement configurables. MonCash, NatCash et les options internationales ne seront activées qu'après vérification des interfaces officielles, de l'éligibilité du compte marchand, des frais et des conditions dans les pays visés.
- Ne pas stocker les numéros de carte, codes de sécurité ni secrets de paiement dans la base IMAGIE. Utiliser le prestataire de paiement pour la saisie des données bancaires.
- Un paiement manuel doit avoir un statut « en attente de vérification » jusqu'à confirmation par un administrateur.

## 5. Catalogue de départ

Le catalogue de départ est organisé en sept familles administrables : Produits de sublimation, Équipements, Impressions, Broderie, Consommables, Textiles et Articles promotionnels. Les filtres de boutique incluent aussi les sous-familles visibles dans les références : Tasses, Tumblers, Bannières, Produits vierges et Équipements.

Les familles à préparer comprennent notamment :
- tasses blanches, magiques, à cœur, avec cuillère;
- tumblers 12, 20, 20/22, 30 et 40 oz, thermos avec anse ou paille, bouteilles et gourdes;
- boîtes à lunch, biberons, ardoises, assiettes, horloges, plaques, porte-clés, broches, portefeuilles, stylos et casquettes;
- coques Samsung et iPhone par modèle;
- presses à chaud, presses à tasses, presses tumbler, presses multi-fonctions, laminatrice, matériel de broderie et pistolets à air chaud;
- films DTF et UV DTF, encres, poudre polyamide, papier de sublimation, rubans thermiques et adhésifs, outils de pose/nettoyage;
- services d'impression DTF, UV DTF, sublimation, vinyle blanc/transparent, bâche/banner, One-Way Vision, roll-up, X-banner, broderie et personnalisation.

Deux produits communiqués directement par le propriétaire doivent être conservés dans le catalogue :
- Tumbler 40 oz avec poignée et paille, variantes de couleur de poignée : prix communiqué 21 USD, à confirmer avant publication.
- Tasse magique noire : prix communiqué 4,60 USD, à confirmer avant publication.

Le fichier `src/data/catalog-seed.json` rassemble les familles à importer. Les références et tarifs du site concurrent servent à comprendre le type de gamme, pas à fixer les prix d'IMAGIE. Les photos concurrentes et les filigranes ne doivent pas être copiés.

## 6. Langues

Langues prioritaires demandées : Français, Kreyòl, English et Español. Langues supplémentaires prévues : Português, Deutsch, Italiano, العربية et 中文. Garder le nom de chaque langue dans sa propre écriture. En arabe, prévoir une mise en page RTL. Toute traduction automatique supplémentaire doit être signalée comme automatique et contrôlée avant de servir pour les prix, politiques ou contrats.

La langue choisie doit être mémorisée pour les visites suivantes et synchronisée au compte lorsque le client se connecte.

## 7. Architecture cible

- Frontend de cette première livraison : Vite + JavaScript en pages HTML distinctes et CSS responsive. Une migration vers Next.js/React peut être envisagée plus tard, mais elle n'est pas nécessaire pour le premier site web/APK.
- Backend : Supabase Auth, PostgreSQL, Storage et Edge Functions.
- Hébergement web : Vercel ou hébergement statique équivalent, avec HTTPS et domaine contrôlé par le propriétaire.
- Dépôt source : GitHub, avec branches, historique et secrets hors dépôt.
- Android : Capacitor autour du build web, avec le même projet Supabase et les mêmes données.
- PWA : manifest, icônes basées sur le logo original, installation navigateur et métadonnées adaptées.

## 8. Sécurité attendue

- HTTPS obligatoire en production.
- RLS sur toutes les tables contenant des données personnelles ou commerciales.
- Le client ne lit que son profil, ses adresses, ses commandes et ses devis.
- Les changements de rôle administrateur sont interdits aux clients et exécutés uniquement par une procédure privilégiée sécurisée.
- La clé `service_role` et les secrets fournisseurs restent uniquement côté serveur, jamais dans le navigateur ou l'APK.
- Authentification renforcée pour les administrateurs, idéalement MFA.
- Limitation de débit, validation serveur, contrôles de type et de taille des téléversements, protection anti-spam et journalisation.
- Sauvegardes vérifiées et procédure de restauration.
- Ne pas promettre une sécurité « inviolable »; viser des contrôles modernes, testés et maintenus.

## 9. Qualité et tests

- Tester chaque route et chaque lien du menu sur mobile et desktop.
- Tester recherche, filtres, variantes, panier, total et persistance du panier.
- Tester les formulaires, erreurs et messages de confirmation.
- Tester les autorisations RLS avec comptes client A, client B et administrateur.
- Tester le suivi de commande contre les accès non autorisés.
- Tester les 9 langues prioritaires, RTL arabe, clavier et lecteurs d'écran.
- Vérifier performance, compression des images, accessibilité, SEO et métadonnées.
- Tester le site et l'APK sur plusieurs tailles d'écran avant publication.
