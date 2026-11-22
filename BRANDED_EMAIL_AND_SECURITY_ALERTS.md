# IMAGIE CRÉATION — e-mails de marque et alertes

- Le fichier `site/assets/imagie-logo-original.jpg` et sa copie publique sont conservés sans modification. Leur SHA-256 correspond au fichier logo fourni par le propriétaire.
- `supabase/templates/confirmation.html` affiche ce logo, le nom IMAGIE CRÉATION et `{{ .Token }}` comme code OTP.
- Les modèles email_change / recovery et sept modèles de sécurité sont prêts à coller dans Supabase.
- `supabase/config.toml` configure l'OTP de 6 chiffres, 300 secondes en CLI/local, confirmation obligatoire et les alertes de sécurité.
- Les publications d'actualités et les nouveaux produits déclenchent déjà Push; l'édition d'un produit publié déclenche maintenant aussi une alerte si le prix, la photo ou l'état de disponibilité change.
- Aucun fichier d'identité visuelle du site n'a été remplacé ou retouché.

Voir `docs/ACTIVATE_EMAIL_OTP_AND_PUSH.md` pour les réglages nécessaires sur le projet Supabase hébergé.
