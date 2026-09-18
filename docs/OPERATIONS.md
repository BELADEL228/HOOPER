# FIRE STONE - Guide d'exploitation

## Démarrage local

1. Copier `.env.example` vers `.env` si une URL API différente est nécessaire.
2. Copier `backend/.env.example` vers `backend/.env` et renseigner `DATABASE_URL` et `JWT_SECRET`.
3. Installer les dépendances avec `npm ci`, puis `cd backend` et `npm ci`.
4. Générer Prisma avec `npm run prisma:generate` depuis `backend`, puis initialiser SQLite avec `npm run prisma:migrate`.
5. Démarrer l'API avec `npm run dev` depuis `backend`, puis le frontend avec `npm run dev` à la racine.

Le frontend fonctionne en mode public même si l'API est arrêtée. En développement, l'API utilise automatiquement SQLite dans `backend/prisma/dev.db`; les fonctions authentifiées sont persistantes sans Supabase. En production, utiliser une URL PostgreSQL managée.

## Contrôles avant livraison

```bash
npm run check
```

Cette commande compile le frontend, exécute Oxlint et compile le backend. La CI GitHub exécute le même contrôle sur chaque pull request et sur `main`.

## Règles de configuration

- Ne jamais committer `.env`, un secret JWT, des identifiants de base ou un token de service.
- En production, `JWT_SECRET` est obligatoire; le serveur refuse de démarrer sans lui.
- `CORS_ORIGIN` doit contenir uniquement les origines publiques autorisées, séparées par des virgules.
- Les rôles d'inscription publique sont toujours `VISITOR`; un administrateur attribue ensuite les rôles privilégiés.
- Le token de récupération de mot de passe n'est renvoyé par l'API qu'en développement. En production, brancher un fournisseur email avant d'activer ce parcours.

## Déploiement

Construire le frontend avec `npm run build` et servir `dist/` derrière un CDN ou un serveur web. Construire l'API avec `cd backend && npm run build`, puis lancer `node dist/server.js` avec des variables d'environnement de production.

Avant le premier déploiement, appliquer les migrations Prisma dans un environnement de staging, vérifier `/api/health`, tester une connexion et consulter les logs du processus API.