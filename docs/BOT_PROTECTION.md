# Vérification anti-robot — IMAGIE CRÉATION

## Architecture installée dans le projet

Le choix est **Cloudflare Turnstile Managed**. Il peut valider automatiquement dans les cas habituels et demander une interaction quand il le juge nécessaire. Le but est de limiter les faux comptes et les tentatives automatisées sans imposer toujours une case à cocher.

- Inscription e-mail/mot de passe : le widget Turnstile fournit un jeton et le code le transmet à Supabase Auth.
- Connexion e-mail/mot de passe : même protection CAPTCHA native Supabase.
- Réinitialisation du mot de passe : même protection CAPTCHA native Supabase.
- Google/Facebook OAuth : le jeton Turnstile est envoyé à la fonction Edge `verify-turnstile`; cette fonction valide le jeton avec Cloudflare Siteverify avant que le navigateur ne lance la redirection OAuth.
- Chaque jeton est consommé une seule fois et le widget est réinitialisé après la tentative.

Supabase Auth prend officiellement en charge hCaptcha et Cloudflare Turnstile pour inscription, connexion et récupération du mot de passe. La fonction OAuth personnalisée valide également le jeton côté serveur, puisque le flux OAuth utilise une redirection distincte.

## Étapes de configuration obligatoires

1. Créer un compte Cloudflare au nom du propriétaire.
2. Dans Turnstile, créer un widget en mode **Managed**; limiter les hostnames aux domaines contrôlés par le propriétaire.
3. Copier la Sitekey publique et la Secret key privée.
4. Dans Supabase Dashboard → Authentication → Bot and Abuse Protection → CAPTCHA, activer CAPTCHA, choisir Turnstile, coller la Secret key et enregistrer.
5. Mettre uniquement la Sitekey publique dans `site/.env.local` sous `VITE_TURNSTILE_SITE_KEY`.
6. Déployer la fonction `supabase/functions/verify-turnstile` avec `supabase functions deploy verify-turnstile`.
7. Stocker la secret key et les domaines autorisés dans Supabase Function secrets :

```bash
supabase secrets set TURNSTILE_SECRET_KEY="VOTRE_SECRET" IMAGIE_ALLOWED_ORIGINS="https://votre-domaine.com,https://www.votre-domaine.com" IMAGIE_ALLOWED_HOSTNAMES="votre-domaine.com,www.votre-domaine.com"
```

8. Ajouter le domaine local de test et le domaine final à la liste d'hôtes Cloudflare. Reconstruire le site après modification de `.env.local`.
9. Tester inscription, connexion, récupération du mot de passe, Google et Facebook avec de vrais comptes tests, et vérifier qu'un jeton absent, expiré ou déjà utilisé est refusé.

**Ne jamais** mettre la Secret key, la clé `service_role` ou d'autres secrets dans le site, GitHub, `.env.local` public ou APK. La clé publique seule peut être envoyée au navigateur.

## Autres contrôles

- La validation de l'inscription e-mail est aussi soumise à la confirmation d'adresse dans Supabase Auth, à activer dans le tableau de bord.
- Le panier, les favoris et les commandes nécessitent un compte connecté, une adhésion `active` et l'acceptation enregistrée des conditions de la communauté.
- La création de commande vérifie encore l'adhésion, le prix et le stock dans la base de données; la vérification JavaScript n'est pas la seule barrière.
- Le rôle administrateur est attribué manuellement au propriétaire; aucun client ne peut s'auto-attribuer ce rôle.
- CAPTCHA ne prouve pas qu'une personne est honnête et ne remplace pas les limites de débit, la MFA administrateur, RLS, les sauvegardes ni la surveillance. En production, activez aussi les limites de débit Supabase Auth et une règle de rate limiting Cloudflare WAF sur les endpoints d'authentification et la fonction `verify-turnstile`.

## Sources officielles consultées
- Supabase — CAPTCHA Protection: https://supabase.com/docs/guides/auth/auth-captcha
- Cloudflare — Get started: https://developers.cloudflare.com/turnstile/get-started/
- Cloudflare — Server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
