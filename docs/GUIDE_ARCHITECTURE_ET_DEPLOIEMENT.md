# Guide de structure et de mise en ligne — IMAGIE CRÉATION

## 1. Intention du projet

IMAGIE CRÉATION est une boutique de personnalisation et d'impression. Le site doit permettre de parcourir le catalogue, créer un compte, devenir membre, préparer une commande et contacter l'équipe. Le compte membre est requis pour le panier et la commande. Un visiteur peut consulter le catalogue sans compte.

Le projet conserve volontairement une architecture simple : plusieurs pages HTML, un JavaScript commun, un CSS commun, Vite pour construire le site et Supabase pour les données et l'authentification. Il n'est pas nécessaire de migrer vers React ou Next.js pour corriger le déploiement actuel.

## 2. Où se trouve chaque chose ?

- `site/` : application web publiée par Vercel.
- `site/*.html` : pages indépendantes (accueil, boutique, métiers, offres, suivi, compte, contact, pages légales, connexion, inscription, etc.).
- `site/assets/app.js` : logique commune de l'application (navigation, catalogue, recherche, panier, compte, commande et interface).
- `site/assets/app.css` : style et mise en page responsive.
- `site/assets/auth-pages.js` : logique des pages de connexion, inscription, OTP et récupération de mot de passe.
- `site/assets/product-modal.js` : fenêtre de détail produit accessible.
- `site/assets/supabase-client.js` : initialisation du client Supabase à partir des variables publiques Vite.
- `site/data/catalog.json` : copie de catalogue lue par le site.
- `src/data/catalog-seed.json` : source canonique du catalogue ; les copies doivent rester identiques.
- `supabase/schema.sql` : tables, fonctions, permissions et politiques de sécurité de la base.
- `supabase/seed_catalog.sql` : données de catalogue initiales.
- `supabase/migrations/` : changements additionnels de base à appliquer dans l'ordre.
- `supabase/functions/` : fonctions serveur, dont protection Turnstile et notifications Push.
- `supabase/templates/` : modèles HTML des e-mails Supabase.
- `site/public/` : fichiers servis directement, comme manifest PWA, service worker, icônes et photos produits.
- `docs/` : décisions, procédures et limites connues.
- `tests/e2e/` : tests navigateur simulés ; ils ne remplacent pas les tests sur Supabase réel.

## 3. Comment les pièces communiquent

1. Le navigateur ouvre une page HTML dans `site/`.
2. La page charge `/assets/app.css` et `/assets/app.js`.
3. `app.js` utilise le catalogue JSON et, si les variables Supabase sont configurées, le client Supabase.
4. Supabase Auth gère les identifiants et la confirmation e-mail. Le site ne doit jamais stocker les mots de passe lui-même.
5. PostgreSQL applique les permissions RLS et les fonctions SQL. Les règles importantes doivent être vérifiées côté serveur, pas seulement cachées dans l'interface.
6. Les fonctions Edge gèrent les opérations qui nécessitent des secrets serveur. Les clés privées ne vont jamais dans le JavaScript public.
7. Vite construit les pages et leurs ressources dans `site/dist/`. Vercel publie ce dossier.

## 4. Pourquoi le 404 pouvait arriver

Le dépôt contient le site dans le sous-dossier `site/`. Si Vercel était réglé sur la racine et ne trouvait pas le bon dossier de sortie, ou si son preset publiait le mauvais dossier `public/`, il pouvait publier un dossier sans `index.html`. Un autre risque était l'absence de fichiers chargés par les pages, notamment `site/assets/app.js` ou `site/assets/app.css`.

Cette livraison comprend deux configurations :
- `site/vercel.json` pour un projet Vercel dont **Root Directory = site** ;
- `vercel.json` à la racine pour un projet dont **Root Directory = ./**.

Choix conseillé pour éviter les ambiguïtés : dans Vercel, régler **Root Directory = site**. Le build doit être `npm run build` et le dossier de sortie `dist`. Le script `prebuild` vérifie d'abord les fichiers requis et donne une liste lisible si un fichier manque.

## 5. Étapes GitHub et Vercel

1. Décompresser l'archive complète sur un ordinateur.
2. Ouvrir le dossier extrait `IMAGIE_CREATION_V7_BOUTIQUE` (ou le dossier racine portant le nom de l’archive).
3. Envoyer son contenu à la racine du dépôt GitHub `brunaljeanralph-art/IMAGIE-CR-ATION`, en conservant les sous-dossiers. Ne pas envoyer le fichier ZIP comme un seul fichier.
4. Vérifier sur GitHub que `site/index.html`, `site/assets/app.js`, `site/assets/app.css`, `site/package.json`, `site/vercel.json` et `vercel.json` existent.
5. Dans Vercel → Project → Settings → General, choisir **Root Directory = site**.
6. Vérifier les commandes : Build Command `npm run build`, Output Directory `dist`. Laisser Vercel installer les dépendances avec `npm install`.
7. Ajouter les variables publiques seulement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY` et, lorsque configurée, `VITE_WEB_PUSH_PUBLIC_KEY`.
8. Redéployer et lire les Build Logs. Il faut voir le contrôle des fichiers requis puis la fin du build Vite sans erreur.
9. Après le déploiement, tester la page d'accueil, les pages internes, les liens, la boutique et la page 404.

## 6. Règles de sécurité à ne pas contourner

- `VITE_ALLOW_GUEST_PURCHASE=false` : les visiteurs voient le catalogue, mais doivent créer un compte et devenir membres pour utiliser le panier et commander.
- Ne jamais ajouter `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, le secret Turnstile, un mot de passe ou un token privé dans GitHub ou dans une variable `VITE_*`.
- Les variables `VITE_*` sont intégrées au JavaScript du navigateur : elles ne sont pas des secrets.
- Les prix non confirmés ne doivent pas être présentés comme des prix définitifs ni être commandables.
- Les paiements MonCash, NatCash et internationaux ne sont pas automatisés dans cette version. L’administrateur peut seulement noter le moyen utilisé et confirmer manuellement le statut après vérification réelle.
- La fonction de commande et les règles RLS doivent être testées sur le vrai projet Supabase avant d'accepter des commandes réelles.

## 7. Ce qui reste à faire avant une vraie ouverture commerciale

- Installer et construire le projet avec `npm install` puis `npm run build` sur une machine avec accès au registre npm.
- Appliquer et tester le schéma, les seeds et les migrations 002/003/004 sur le projet Supabase réel.
- Configurer les URL de redirection Auth, SMTP, confirmation e-mail et modèle OTP.
- Configurer Turnstile et les fournisseurs OAuth réellement disponibles.
- Configurer les clés VAPID et déployer `send-push` ainsi que `send-order-update` si les notifications Push sont souhaitées.
- Tester les permissions avec deux comptes clients distincts et un compte administrateur.
- Valider les prix et les photos manquantes, finaliser les politiques commerciales et choisir/configurer un prestataire de paiement si le paiement automatisé est souhaité.
- Vérifier la console admin, les sauvegardes, les limites de débit et les textes légaux.

La version v7 ajoute les filtres/comparaison, galerie et recommandations produit, les variantes persistantes au panier/commande, les adresses, les détails de commande en administration, la saisie manuelle des frais/moyens/statuts de paiement et les notifications Push ciblées après changement de statut. Elle ne doit pas être présentée comme une boutique de paiement en ligne entièrement opérationnelle tant que les intégrations réelles ci-dessus n'ont pas été configurées et testées.
