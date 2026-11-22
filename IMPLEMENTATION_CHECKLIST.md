# Liste de contrôle — ne rien oublier

## Identité et navigation
- [ ] Logo original utilisé sans modification.
- [ ] Palette issue du logo; thème bleu marine/orange inspiré de la vidéo IMAGIE.
- [ ] En-tête : logo, langue, compte, panier, menu.
- [ ] Menu mobile ouvrant des pages indépendantes.
- [ ] Retour du navigateur/téléphone et liens actifs.
- [ ] Pied de page complet sur toutes les pages.

## Accueil
- [ ] Slider automatique, points, pause/reprise.
- [ ] Section d'accueil « Vos idées, en couleurs ».
- [ ] Accès Boutique et WhatsApp.
- [ ] Produits préférés/populaires.
- [ ] Catégories, nouveautés, promotions.
- [ ] Nos métiers, avantages, demandes de devis, témoignages authentiques.
- [ ] Animations douces et prise en charge de la réduction des mouvements.

## Boutique
- [ ] Recherche nom/code.
- [ ] Filtres de catégorie et sous-catégorie.
- [ ] Tri et disponibilité.
- [ ] Photo, nom, code, prix, quantité.
- [ ] Variantes (couleur, taille, format, oz, modèle téléphone).
- [ ] Fiches détaillées et photos autorisées.
- [ ] Prix éditables par l'administrateur.
- [ ] Panier persistant, changement de quantité, suppression, total.
- [ ] Import/Export de catalogue.

## Services et contenu
- [ ] Sublimation.
- [ ] DTF / UV DTF.
- [ ] Stickers / vinyle.
- [ ] Bâches, bannières, roll-up, X-banner, One-Way Vision.
- [ ] Broderie.
- [ ] Logos et création graphique.
- [ ] Équipements et consommables.
- [ ] Offres configurables, sans tarifs fictifs.
- [ ] À propos, mission et touche personnelle validée.

## Clients, commandes, paiements
- [ ] Création de compte et connexion e-mail.
- [ ] Google OAuth activé et testé.
- [ ] Facebook OAuth activé et testé.
- [ ] Vérification e-mail et réinitialisation mot de passe.
- [ ] Profil, adresses, préférences, historique.
- [ ] Demande de devis membre : insertion RLS, pièce jointe privée, historique client et statuts modifiables depuis la console propriétaire.
- [ ] Enregistrement réel des commandes dans la base.
- [ ] Numéro de commande unique et suivi sécurisé.
- [ ] Notifications e-mail/WhatsApp si configurées.
- [ ] MonCash/NatCash et options internationales vérifiées avant activation.
- [ ] Aucun secret de carte ni clé privée dans le frontend.

## Communauté et privilèges clients
- [ ] Inscription gratuite, acceptation des conditions et vérification d’e-mail.
- [ ] Panier, favoris et commande impossibles sans compte connecté et adhésion active.
- [ ] Numéro membre unique créé automatiquement.
- [ ] Connexion/déconnexion et réinitialisation de mot de passe.
- [ ] CAPTCHA Cloudflare Turnstile visible et jeton vérifié par Supabase Auth pour inscription, connexion et récupération du mot de passe.
- [ ] Sitekey seulement dans le frontend; Secret key uniquement dans les paramètres Supabase.
- [ ] Inscription, connexion et récupération refusées en l'absence de jeton valide lorsque CAPTCHA est activé.
- [ ] Connexion Google/Facebook après configuration OAuth.
- [ ] Historique de commandes et suivi limité aux commandes du membre connecté.
- [ ] Profil, adresses, devis, favoris/liste de souhaits.
- [ ] Actualités et offres réservées aux membres.
- [ ] Règles du programme de points/récompenses définies avant d’annoncer des avantages financiers.
- [ ] Aucun client ne peut lire les données d’un autre membre ou changer son rôle.

## Administration
- [ ] Aucun lien administration dans le menu ou le pied de page client.
- [ ] Accès uniquement à un rôle admin vérifié côté serveur.
- [ ] Gestion produits, catégories, variantes, photos, prix et stock.
- [ ] Gestion commandes, clients, devis et paiements.
- [ ] Promotions, frais de livraison et contenu des pages.
- [ ] Statistiques et journal d'audit.
- [ ] MFA et protections de connexion.

## Langues, qualité, publication
- [ ] Français, Kreyòl, English, Español.
- [ ] Português, Deutsch, Italiano, العربية (RTL), 中文.
- [ ] Langue mémorisée.
- [ ] Test mobile/tablette/desktop.
- [ ] Tests sécurité/RLS avec plusieurs rôles.
- [ ] Tests de performance, accessibilité, SEO.
- [ ] PWA installable.
- [ ] APK Android généré et testé.
- [ ] Domain/hosting configurés par le propriétaire.

## Avant le lancement
- [ ] Prix définitifs fournis par le propriétaire.
- [ ] Photos originales ou licences commerciales vérifiées.
- [ ] Variantes et stocks confirmés.
- [ ] Coordonnées et réseaux sociaux vérifiés.
- [ ] Politiques de confidentialité, conditions et livraison validées.
- [ ] Paiements et frais approuvés et testés.
