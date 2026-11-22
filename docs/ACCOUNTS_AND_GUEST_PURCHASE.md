# Comptes clients, adhésion obligatoire et installation (Chrome)

## Décision produit (22 nov. 2026)
- **Un compte vérifié et une adhésion Imagie Community active sont requis** pour ajouter au panier, commander, enregistrer des favoris, suivre une commande et accéder aux avantages.
- Les visiteurs peuvent parcourir le catalogue sans compte. `VITE_ALLOW_GUEST_PURCHASE=false` est la valeur par défaut; ne l’activer que si le propriétaire modifie explicitement la règle.

## Pages (une par espace, design classique type Google)
| Page | Rôle |
|---|---|
| `connexion.html` | E-mail + mot de passe. Petits liens en bas : « Mot de passe oublié ? », « Créer un compte », « E-mail oublié ? » (message WhatsApp pré-rempli, vérification d'identité manuelle par Imagie). Boutons Google / Facebook / X. |
| `inscription.html` | Prénom, Nom, date de naissance (**18 ans minimum**), téléphone, e-mail, mot de passe + confirmation, acceptation. Ou Google / Facebook / X pour éviter le formulaire. |
| `mot-de-passe-oublie.html` | Envoi du lien (réponse neutre : ne dit pas si le compte existe) puis `?mode=reset` pour le nouveau mot de passe. |
| `completer-profil.html` | Pour les comptes créés via Google/Facebook/X : prénom, nom, naissance (18+), téléphone, adhésion. |
| `compte.html` | Espace membre. Sans session → redirige vers `connexion.html`. Profil incomplet → `completer-profil.html`. |

## Sécurité / confidentialité
- Mots de passe : uniquement dans Supabase Auth (hachés). Jamais dans nos tables.
- Anti-robot Turnstile avant connexion, inscription, mot de passe oublié et connexion sociale ; jeton à usage unique.
- Âge : contrôle navigateur **et** serveur (`supabase/migrations/002_account_profile_adult.sql` : trigger `ADULT_REQUIRED`, date de naissance verrouillée après saisie, `accept_community_terms` refuse un profil sans date de naissance).
- Date de naissance, téléphone : lisibles par le titulaire et l'admin seulement (RLS existante).
- Le navigateur n'envoie jamais rôle, consentement ni statut admin.

## À faire par vous (comptes personnels)
1. Supabase → SQL Editor : `schema.sql`, puis `seed_catalog.sql`, puis `migrations/002_account_profile_adult.sql` et `migrations/003_email_otp_and_push_notifications.sql`.
2. Authentication → URL Configuration : Site URL + Redirect URLs (`https://votre-domaine/**`).
3. Providers : Google ; Facebook ; **X / Twitter (OAuth 2.0)** — nom de fournisseur `x` ; dans l'app X, activer « Request email from users ».
4. Authentication → CAPTCHA (Turnstile) + SMTP personnalisé. Pour le code e-mail, activer Confirm email et afficher `{{ .Token }}` dans le modèle Confirm signup.
5. Réseaux sociaux : renseigner les URL manquantes dans `socialLinks()` (Instagram, X, TikTok, YouTube, LinkedIn) — rien n'est inventé.

## Installation sur Chrome (PWA)
Manifest + icônes PNG 192/512 (+ maskable), service worker tolérant aux fichiers hachés, bouton « Installer l'app » dans le pied de page (apparaît quand Chrome propose l'installation ; sur iPhone : indication Partager → Sur l'écran d'accueil). Nécessite HTTPS (Vercel).

## Non testé ici
Supabase réel, OAuth réels, Turnstile réel, SMTP / envoi OTP réel, déploiement de la fonction Push, exécution SQL et `npm run build`. Voir `docs/ACTIVATE_EMAIL_OTP_AND_PUSH.md`.
