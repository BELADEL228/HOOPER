# Base de données

SQLite local est la source de vérité du développement sans budget; le fichier est `backend/prisma/dev.db`. PostgreSQL reste la cible de production lorsque Supabase ou un autre fournisseur sera disponible. Prisma décrit les entités dans `backend/prisma/schema.prisma`.

Le MVP persiste déjà les utilisateurs, profils joueurs, transactions, matchs, événements, candidatures et journées Champions. Les équipes et leurs membres sont maintenant modélisées avec les contraintes suivantes :

- nom et slug d'équipe uniques ;
- catégorie contrôlée par enum ;
- membre unique par couple équipe/utilisateur ;
- suppression en cascade des membres lors de la suppression d'une équipe.

Commandes :

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Toujours valider une migration sur une base de staging avant production. Ne jamais utiliser reset sur une base contenant des données utiles.