# Activation des e-mails de marque, alertes de sécurité et notifications IMAGIE CRÉATION

Le code contient les modèles HTML personnalisés (avec le logo officiel non modifié), le formulaire OTP à 6 chiffres, les alertes de sécurité Supabase et les notifications Web Push. Le ZIP ne peut pas activer à distance les paramètres de votre projet hébergé : les étapes Dashboard ci-dessous sont nécessaires une seule fois.

## A. Ce que les clients recevront

- À l'inscription : un e-mail « IMAGIE CRÉATION » avec le logo original et le code OTP de 6 chiffres.
- Si le mot de passe change : un e-mail d'alerte de sécurité.
- Si l'adresse e-mail ou le numéro d'authentification change : un e-mail d'alerte.
- Si une méthode de connexion (Google, etc.) est ajoutée ou retirée : un e-mail d'alerte.
- Si une méthode MFA est ajoutée ou retirée : un e-mail d'alerte.
- Si un nouveau produit est publié, si son prix/la photo est mis à jour, ou si une actualité active est publiée : une notification navigateur aux personnes qui ont accepté les notifications Push.

Les e-mails de sécurité sont les notifications natives de Supabase Auth. Les modifications du nom affiché dans `profiles` ne sont pas un événement de sécurité Auth natif; le site affiche déjà une confirmation après l'enregistrement du profil.

## B. Configurer l'e-mail OTP de marque (une seule fois)

1. Ouvrir Supabase Dashboard → Authentication → Sign In / Providers → Email.
2. Activer **Confirm email**. Le formulaire du site attend une confirmation obligatoire.
3. Régler **Email OTP expiration** sur **300 secondes (5 minutes)** et conserver une longueur de code de **6 chiffres**.
4. Ouvrir Authentication → Email Templates → **Confirm signup**. Définir le sujet `Votre code de vérification — IMAGIE CRÉATION`, puis remplacer le contenu HTML par le fichier `supabase/templates/confirmation.html`.
5. Ouvrir **Change email address** et coller `supabase/templates/email_change.html`. Ouvrir **Reset password** et coller `supabase/templates/recovery.html`.
6. Configurer un serveur SMTP de production dans les réglages SMTP Supabase. Vérifier le domaine expéditeur chez le fournisseur avant d'envoyer à tous les clients. Le SMTP de test Supabase ne livre pas à toutes les adresses.
7. Dans Auth URL Configuration, définir le Site URL à `https://imagie-cr-ation.vercel.app` et autoriser cette URL comme redirection.

Le logo dans le courriel est chargé depuis `https://imagie-cr-ation.vercel.app/assets/imagie-logo-original.jpg`. Le fichier du dépôt est identique octet par octet au logo que vous avez fourni; aucune retouche ni déformation n'a été faite.

## C. Activer les e-mails automatiques de sécurité

Dans Supabase Dashboard → Authentication → Email Templates / Security Notifications (le libellé peut varier selon l'écran), activer les notifications suivantes et coller le fichier correspondant comme contenu HTML :

| Événement | Fichier HTML |
|---|---|
| Mot de passe modifié | `supabase/templates/password_changed_notification.html` |
| Adresse e-mail modifiée | `supabase/templates/email_changed_notification.html` |
| Téléphone Auth modifié | `supabase/templates/phone_changed_notification.html` |
| Connexion liée | `supabase/templates/identity_linked_notification.html` |
| Connexion retirée | `supabase/templates/identity_unlinked_notification.html` |
| Protection MFA ajoutée | `supabase/templates/mfa_factor_enrolled_notification.html` |
| Protection MFA retirée | `supabase/templates/mfa_factor_unenrolled_notification.html` |

Utiliser les sujets déjà indiqués dans `supabase/config.toml`. Ces alertes seront envoyées à l'adresse e-mail associée au compte, selon les événements gérés par Supabase Auth.

## D. Activer les notifications de nouveautés sur téléphone

1. Générer une paire VAPID sur une machine de confiance : `npx web-push generate-vapid-keys`.
2. Dans Vercel → Settings → Environment Variables, ajouter `VITE_WEB_PUSH_PUBLIC_KEY` avec la clé publique, puis redéployer.
3. Dans Supabase SQL Editor, exécuter `supabase/migrations/003_email_otp_and_push_notifications.sql` après le schéma principal et la migration 002.
4. Déployer depuis la racine du dépôt : `supabase functions deploy send-push`.
5. Enregistrer uniquement dans Supabase secrets :

```bash
supabase secrets set VAPID_PUBLIC_KEY="CLE_PRIVEE_NON_PUBLIQUE" VAPID_PRIVATE_KEY="CLE_PRIVEE" VAPID_SUBJECT="mailto:VOTRE_EMAIL_DE_CONTACT" IMAGIE_ALLOWED_ORIGINS="https://imagie-cr-ation.vercel.app"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis aux Edge Functions par Supabase. Ne jamais mettre la clé VAPID privée ou `service_role` dans le site, Vercel public variables, ni GitHub.

Sur le site, la personne doit choisir **Activer les notifications** et accepter la demande du navigateur. Les notifications ne sont pas envoyées aux personnes qui refusent. Sur iPhone/iPad, Web Push nécessite normalement que le site soit installé sur l'écran d'accueil.

## E. Contrôle avant lancement

- [ ] Tester un nouveau compte avec une adresse e-mail externe, vérifier que le logo et le code apparaissent.
- [ ] Entrer un code faux, un code expiré et un code valide.
- [ ] Changer le mot de passe d'un compte test et vérifier l'e-mail d'alerte.
- [ ] Tester une modification d'adresse e-mail ou de téléphone Auth.
- [ ] Tester les alertes de connexion liée/retirée et MFA si ces méthodes sont activées.
- [ ] Accepter Push sur un téléphone test puis publier un produit/une actualité test.
- [ ] Refuser Push sur un autre appareil et vérifier qu'il ne reçoit aucune alerte navigateur.

**Important :** `supabase/config.toml` documente et configure l'environnement CLI/local. Un projet Supabase hébergé doit aussi recevoir les modèles, SMTP, confirmation, durée OTP et alertes via son Dashboard (ou Management API). Le ZIP n'a pas accès aux identifiants de votre Supabase/Vercel et ne peut pas activer ces réglages à votre place.
