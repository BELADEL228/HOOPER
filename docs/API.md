# API MVP

Base locale : `http://localhost:5000/api`

## Santé

`GET /health` est public et renvoie l'état de l'API.

## Authentification

- `POST /auth/register` : crée un compte public avec le rôle `VISITOR`.
- `POST /auth/login` : renvoie un JWT et l'utilisateur.
- `GET /auth/me` : renvoie l'utilisateur courant. JWT requis.
- `PUT /auth/profile` : met à jour le profil courant. JWT requis.
- `POST /auth/change-password` : change le mot de passe. JWT requis.

Le header est `Authorization: Bearer <token>`. Les réponses d'erreur utilisent `{ "error": "..." }`.

## Équipes

- `GET /teams` : liste publique, triée par nom.
- `POST /teams` : crée une équipe. Rôles `ADMIN` ou `SUPER_ADMIN` requis.

Exemple de création :

```json
{
  "name": "FIRE STONE U18",
  "slug": "fire-stone-u18",
  "city": "Lome",
  "category": "U18"
}
```

## Réseau social

- `GET /posts` : feed public paginé par limite (`?limit=20`).
- `POST /posts` : crée une publication. JWT requis.
- `POST /posts/:id/like` : active ou retire le like. JWT requis.
- `POST /posts/:id/comments` : ajoute un commentaire. JWT requis.
- `POST /users/:id/follow` : active ou retire un abonnement. JWT requis.

Les contenus sont validés côté serveur et supprimés automatiquement avec leur auteur. Les likes et abonnements sont uniques par utilisateur.

## Notifications

- `GET /notifications` : liste les notifications de l'utilisateur connecté.
- `POST /notifications/read-all` : marque toutes les notifications comme lues.

Un like ou un commentaire sur une publication crée automatiquement une notification pour son auteur.

## Joueurs

- `GET /players` : liste publique du roster courant.
- `POST /players` : ajout réservé à `COACH`, `ADMIN`, `SUPER_ADMIN`.
- `DELETE /players/:id` : suppression réservée à `COACH`, `ADMIN`, `SUPER_ADMIN`.

Les endpoints joueurs historiques utilisent encore le fallback mémoire et seront migrés vers `PlayerProfile` dans la prochaine tranche.

## Terrains

- `GET /venues` : liste publique des terrains, filtrable par ville avec `?city=Lomé`.
- `POST /venues` : ajoute un terrain. Rôles `ADMIN` ou `SUPER_ADMIN` requis.

Les terrains exposent les coordonnées GPS, la capacité, le type de surface, l'état, l'éclairage, les vestiaires et le parking.

## Demandes de matchs

- `GET /match-requests?teamId=<id>` : liste les demandes d'une équipe. Rôles club requis.
- `POST /match-requests` : propose un match entre deux équipes. Rôles club requis.
- `PATCH /match-requests/:id` : accepte, refuse ou contre-propose une demande. Rôles club requis.

Une demande acceptée crée automatiquement un match `UPCOMING` et informe les membres concernés.

## Live scoring

- `GET /matches/:id/events` : liste le play-by-play public d'un match.
- `POST /matches/:id/events` : ajoute un événement live et incrémente le score FIRE STONE. Rôles `COACH`, `ADMIN` ou `SUPER_ADMIN` requis.

## Tournois

- `GET /tournaments` : liste les compétitions avec équipes et classement.
- `POST /tournaments` : crée une compétition. Rôles club requis.
- `POST /tournaments/:id/teams` : inscrit une équipe. Rôles club requis.
- `PATCH /tournaments/:id/standings/:teamId` : met à jour les statistiques de classement. Rôles club requis.

## Sponsors et partenariats

- `GET /sponsors` : liste les sponsors vérifiés et publics.
- `POST /sponsorship-requests` : crée ou met à jour le profil sponsor courant et envoie une demande à une équipe.
- `GET /sponsorship-requests` : liste les demandes pour les gestionnaires club.
- `PATCH /sponsorship-requests/:id` : fait évoluer une demande (`DISCUSSION`, `ACCEPTED`, `DECLINED`, `FINALIZED`).

## Messagerie

- `GET /messages/general` : charge les 100 derniers messages du canal général. JWT requis.
- `POST /messages/general` : envoie un message dans le canal général. JWT requis.

Les conversations privées et de groupe sont modélisées dans Prisma (`Conversation`, `Message`) et seront ajoutées au même contrat après le canal général.

## Scouting

- `GET /scouting/shortlist` : charge la shortlist du coach connecté.
- `POST /scouting/shortlist` : ajoute un profil joueur à la shortlist.
- `DELETE /scouting/shortlist/:playerProfileId` : retire un profil joueur.

Les opérations de shortlist sont réservées aux rôles `COACH`, `ADMIN` et `SUPER_ADMIN`.