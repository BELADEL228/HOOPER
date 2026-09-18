# Architecture

FIRE STONE est actuellement un monorepo léger :

- `src/` : SPA React + TypeScript + Vite, organisée par composants métier.
- `backend/src/server.ts` : API Express et WebSocket-ready.
- `backend/prisma/` : modèle Prisma, migrations et base SQLite locale.
- `docs/` : contrats et procédures d'exploitation.

Les composants existants sont conservés. Les données progressivement migrées vers l'API doivent garder un fallback local uniquement pour le développement hors base de données. Le frontend ne doit jamais décider seul d'une permission; l'API vérifie toujours le JWT et le rôle.

## Flux cible

```text
React -> API REST -> services métier -> Prisma -> SQLite local / PostgreSQL production
                         |-> Socket.IO (temps réel)
                         |-> stockage média (à brancher)
                         |-> service IA (à brancher)
```

Les modules sont livrés dans cet ordre : identité et équipes, joueurs, matchs, réseau social, puis tournois et services avancés.