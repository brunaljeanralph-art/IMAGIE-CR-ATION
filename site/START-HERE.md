# Démarrer IMAGIE CRÉATION

Cette livraison est une base de site responsive multi-pages et le début du backend de production. Les services externes restent à connecter avec les comptes appartenant au propriétaire.

## Ce que voit un client
- Accueil animé, catalogue, services, offres, À propos et contact.
- Le catalogue peut être consulté sans compte.
- Pour ajouter au panier, sauvegarder des favoris, commander, suivre ses commandes et accéder aux avantages, le visiteur doit créer un compte et accepter les conditions de la communauté IMAGIE.
- L'inscription crée un profil client et un numéro de membre. Le consentement est enregistré avec sa version et sa date.
- Le panier membre est synchronisé à la base de données afin de retrouver les articles sur un autre appareil après connexion.
- Le compte membre affiche son profil, ses commandes, ses favoris et les annonces réservées aux membres.

## Ce que voit le propriétaire
- La page `/admin.html` n'est pas dans le menu public et porte `noindex,nofollow`.
- Elle ne montre le tableau de bord qu'après vérification d'une session et du rôle `admin` dans Supabase.
- Le propriétaire peut consulter les commandes et clients, modifier le statut d'adhésion, ajouter des produits, charger leurs photos, modifier prix/stock/visibilité et publier des annonces membres.
- Aucun formulaire public ne permet de créer un compte administrateur. Le rôle `admin` doit être accordé manuellement au compte du propriétaire.
- Les tables et les Storage policies RLS empêchent un compte client de lire ou modifier les données des autres clients ou de gérer le catalogue.

## Pages
- `index.html` — accueil et slider animé
- `boutique.html` — recherche, catégories, articles, favoris et panier
- `metiers.html` — services et demande de devis
- `offres.html` — promotions et offres
- `a-propos.html` — mission et présentation
- `suivi.html` — suivi lié au compte et à son téléphone
- `compte.html` — inscription, connexion, communauté et espace membre
- `contact.html` — coordonnées et prise de contact
- `confidentialite.html`, `conditions.html`, `livraison.html` — pages légales à finaliser par le propriétaire
- `admin.html` — accès privé propriétaire, sans lien public

## Installation locale
1. Installer Node.js LTS.
2. Ouvrir `site/` dans VS Code.
3. Copier `.env.example` vers `.env.local`.
4. Renseigner `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY` et, après création des clés VAPID, `VITE_WEB_PUSH_PUBLIC_KEY`. `VITE_ALLOW_GUEST_PURCHASE` reste à `false`.
5. Exécuter `npm install`, puis `npm run dev`.
6. Pour compiler le site : `npm run build`.

## Configurer Supabase
1. Créer un projet Supabase au nom du propriétaire.
2. Exécuter `../supabase/schema.sql` dans SQL Editor.
3. Exécuter `../supabase/seed_catalog.sql` pour créer les 48 familles initiales du catalogue. Ce seed est idempotent et ne remplace pas les prix ou données modifiés par la suite.
4. Exécuter `../supabase/migrations/002_account_profile_adult.sql`, puis `../supabase/migrations/003_email_otp_and_push_notifications.sql`, puis `../supabase/migrations/004_variant_cart_checkout_and_shipping.sql`.
5. Dans Authentication, activer la confirmation des e-mails, utiliser `{{ .Token }}` dans le modèle Confirm signup, configurer le SMTP de production, définir les Site URL et Redirect URLs et configurer les fournisseurs OAuth Google/Facebook uniquement après avoir obtenu leurs identifiants.
6. Créer le compte du propriétaire via la page Mon compte, confirmer son adresse e-mail, puis trouver son UUID dans Authentication → Users.
7. Dans SQL Editor, attribuer le rôle administrateur à cet UUID exact :

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_EXACT_DU_PROPRIETAIRE';
```

Ne pas transmettre ni publier de clé secrète. La clé `service_role` ne doit jamais être mise dans le frontend ou dans l'APK.

## Configurer l'anti-robot
1. Créer un widget Cloudflare Turnstile en mode Managed et limiter ses hostnames au domaine de production et de test.
2. Copier la Sitekey publique dans `VITE_TURNSTILE_SITE_KEY` côté site.
3. Dans Supabase → Authentication → Bot and Abuse Protection → CAPTCHA, activer CAPTCHA, choisir Cloudflare Turnstile et ajouter la Secret key.
4. Déployer la fonction Supabase `verify-turnstile` pour la validation server-side avant Google/Facebook OAuth :

```bash
supabase functions deploy verify-turnstile
supabase secrets set TURNSTILE_SECRET_KEY="VOTRE_SECRET" IMAGIE_ALLOWED_ORIGINS="https://votre-domaine.com,https://www.votre-domaine.com" IMAGIE_ALLOWED_HOSTNAMES="votre-domaine.com,www.votre-domaine.com"
```

Ajouter les hostnames de préproduction si utilisés. La secret key reste uniquement dans Supabase Auth et Supabase Function secrets. Les formulaires e-mail/mot de passe utilisent le CAPTCHA natif Supabase; le flux OAuth passe par la fonction qui appelle Cloudflare Siteverify.

## Commande et paiement
- La fonction SQL `create_order_from_cart` recalcule le prix, vérifie le stock, l'adhésion et le numéro de téléphone côté base de données avant d'enregistrer une commande.
- Après l'enregistrement, le site prépare un récapitulatif WhatsApp vers le numéro principal.
- Cela ne traite pas encore un paiement électronique. MonCash, NatCash et fournisseurs internationaux devront être intégrés et testés séparément. Les paiements manuels doivent rester « en attente de vérification » tant qu'un administrateur ne les confirme pas.
- Les produits dont le prix n'a pas été confirmé ne peuvent pas passer au checkout.

## Codes de vérification et notifications Push

Suivre `../docs/ACTIVATE_EMAIL_OTP_AND_PUSH.md` pour activer le code e-mail OTP, le SMTP, la migration 003, les clés VAPID et les fonctions `send-push` et `send-order-update`. Tant que ces paramètres ne sont pas saisis dans Supabase et Vercel, l’interface et le code sont prêts mais aucun code réel ni notification Push ne peut être envoyé.

## APK Android
Le projet est préparé avec Capacitor, mais aucun APK signé n'est livré. Après configuration et test de la version web :

```bash
npm install
npm run build
npx cap add android   # une seule fois
npx cap sync android
npx cap open android
```

Installer Android SDK dans Android Studio, tester sur un vrai appareil et générer l'APK/AAB de production. Le site et l'APK utiliseront le même backend.

## Avant la mise en ligne
- Confirmer les coordonnées, les prix, variantes, stocks et politiques commerciales.
- Ajouter uniquement des photos originales ou des visuels avec licence commerciale; ne pas réutiliser les photos Focus Print ou filigranées sans autorisation.
- Traduire et relire les neuf langues prévues; la version actuelle reste partielle hors FR/HT/EN/ES.
- Activer MFA pour le compte propriétaire, configurer les e-mails transactionnels, les limites de débit, sauvegardes et alertes.
- Effectuer des tests RLS avec deux comptes clients et le compte propriétaire.
- Les 48 entrées sont des familles initiales, pas une reproduction exhaustive de chaque SKU du catalogue de référence. La console admin permet maintenant de gérer les variantes, les états de commande et de paiement ainsi que les frais de livraison. Les passerelles de paiement automatiques, la gestion avancée des promotions et l’automatisation logistique restent à intégrer séparément.


## Migration v7 obligatoire avant commande avec variantes

Dans Supabase → SQL Editor, après les scripts de base et les migrations 002 et 003, exécutez `supabase/migrations/004_variant_cart_checkout_and_shipping.sql`. Sans elle, l'ancienne structure du panier ne peut pas sauvegarder les variantes ni l'adresse choisie.


### Notifications ciblées des commandes

La fonction `send-order-update` vérifie le rôle administrateur, lit la commande côté serveur puis envoie une notification uniquement aux appareils Push rattachés au compte client propriétaire de cette commande. Elle ne diffuse pas le statut de commande aux autres clients. Déployer avec `supabase functions deploy send-order-update`.
