# Sécurité

- Les secrets sont stockés dans l'environnement et ne sont jamais codés en dur.

- Les secrets sont fournis par l'environnement, jamais par le frontend.
- Le rôle envoyé par un formulaire public est ignoré.
- Les routes sensibles vérifient JWT et rôle côté serveur.
- Les tentatives d'authentification sont limitées par adresse IP.
- CORS est limité à `CORS_ORIGIN`.
- Les payloads JSON sont limités à `MAX_JSON_BODY_SIZE`.
- Les tokens de récupération ne sont renvoyés qu'en développement; un fournisseur email doit être configuré avant production.
- Les uploads devront vérifier extension, type MIME, taille et contenu avant stockage.

Avant mise en production : remplacer SQLite par une base PostgreSQL managée, supprimer le fallback mémoire, configurer un gestionnaire email, activer des logs d'audit et réaliser un test de restauration.